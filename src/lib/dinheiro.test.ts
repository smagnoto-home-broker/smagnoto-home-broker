import { test } from "node:test";
import assert from "node:assert/strict";
import { paraCentavos, deCentavos, percentual, ratear, somar } from "./dinheiro";

test("paraCentavos aceita numero, ponto e virgula", () => {
  assert.equal(paraCentavos(3450), 345000);
  assert.equal(paraCentavos("3450.50"), 345050);
  assert.equal(paraCentavos("1.234,56"), 123456);
  assert.equal(paraCentavos(-10.5), -1050);
  assert.throws(() => paraCentavos("abc"));
});
test("deCentavos", () => assert.equal(deCentavos(123456), 1234.56));
test("percentual arredonda ao centavo", () => {
  assert.equal(percentual(345000, 10), 34500); // taxa 10% de 3.450
  assert.equal(percentual(6919200, 9.65), 667703); // imposto 9,65%
  assert.equal(percentual(1, 50), 1); // 0,5 centavo -> 1
});
test("ratear nunca perde centavo", () => {
  assert.deepEqual(ratear(100, [1, 1, 1]), [34, 33, 33]);
  assert.equal(somar(...ratear(284600, [3, 2, 5])), 284600);
  assert.deepEqual(ratear(1000, [20, 20, 60]), [200, 200, 600]);
});
