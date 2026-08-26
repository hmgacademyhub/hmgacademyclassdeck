import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

class Emitter {
  constructor(peer = "peer") { this.peer = peer; this.handlers = {}; this.sent = []; this.closed = false; }
  on(type, fn) { (this.handlers[type] ||= []).push(fn); return this; }
  emit(type, ...args) { for (const fn of this.handlers[type] || []) fn(...args); }
  send(message) { this.sent.push(message); }
  close() { this.closed = true; this.emit("close"); }
}

const peers = [];
class MockPeer extends Emitter {
  constructor(id) { super(id || `student-${peers.length}`); this.id = id || this.peer; this.destroyed = false; peers.push(this); }
  connect() { this.conn = new Emitter("student-connection"); return this.conn; }
  call(peer) { const call = new Emitter(peer); call.metadata = {}; call.answer = () => { call.answered = true; }; return call; }
  reconnect() {}
  destroy() { this.destroyed = true; }
}

const context = {
  console, Peer: MockPeer, setTimeout, clearTimeout, Date, Math, Error, Number, String,
  Array, Object, JSON, Promise, Uint8Array,
  Store: { get: (_key, fallback) => fallback, set() {} },
  nowStamp: () => "now"
};
vm.createContext(context);
const source = fs.readFileSync(new URL("../js/rtc.js", import.meta.url), "utf8") +
  "\nthis.__test = { TeacherRoom, StudentRoom, safeBoardStrokes };";
vm.runInContext(source, context, { filename: "js/rtc.js" });
const { TeacherRoom, StudentRoom, safeBoardStrokes } = context.__test;

const safe = safeBoardStrokes([{ c: "<bad>", w: 999, p: [[2, -1], [0.5, 0.5]] }]);
assert.equal(safe[0].c, "#111111");
assert.equal(safe[0].w, 24);
assert.deepEqual(Array.from(safe[0].p[0]), [1, 0]);

const teacher = new TeacherRoom("ABC123");
teacher.peer = new MockPeer("host");
teacher._wire();
teacher.students.set("student-1", { name: "Ada", conn: new Emitter(), mediaCalls: [], micAllowed: false });
const deniedMic = teacher.peer.call("student-1");
deniedMic.metadata = { kind: "stumic" };
teacher.peer.emit("call", deniedMic);
assert.equal(deniedMic.closed, true, "student mic must be denied before teacher approval");
teacher.allowMic("student-1", true);
const allowedMic = teacher.peer.call("student-1");
allowedMic.metadata = { kind: "stumic" };
teacher.peer.emit("call", allowedMic);
assert.equal(allowedMic.answered, true, "approved student mic should be answered");

teacher.waitingRoom = true;
teacher._admit = () => { teacher._admittedCount = (teacher._admittedCount || 0) + 1; };
teacher.pending.set("pending-1", { conn: new Emitter(), name: "Bayo" });
teacher.setWaitingRoom(false);
assert.equal(teacher._admittedCount, 1, "turning waiting room off must admit queued students");

const student = new StudentRoom("ABC123", "Ada", { onEvent: () => {} });
const waiting = student.join();
const studentPeer = peers.at(-1);
studentPeer.emit("open");
student.conn.emit("open");
student.conn.emit("data", { t: "waiting" });
assert.equal((await waiting).state, "waiting");

const rejectedStudent = new StudentRoom("ABC123", "Ada", { onEvent: () => {} });
const rejected = rejectedStudent.join();
peers.at(-1).emit("open");
rejectedStudent.conn.emit("open");
rejectedStudent.conn.emit("data", { t: "rejected", reason: "Wrong class PIN." });
await assert.rejects(rejected, (error) => error.retryable === false && error.message === "Wrong class PIN.");

console.log("RTC handshake, waiting-room, media-permission and payload tests passed ✔");
