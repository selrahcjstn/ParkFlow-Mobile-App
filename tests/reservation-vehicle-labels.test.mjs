import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, mocks = {}) {
  const code = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => mocks[name] });
  return exports;
}
const { VehicleType, getVehicleTypeLabel } = load('constants/vehicleType.ts');
const { getReservationVehicleType } = load('utils/reservationVehicle.ts');

test('persisted vehicle enum and numeric/string API labels stay consistent', () => {
  assert.equal(VehicleType.Motorcycle, 0); assert.equal(VehicleType.ElectricBike, 1); assert.equal(VehicleType.Car, 2);
  for (const [value, label] of [[0, 'Motorcycle'], [1, 'E-Bike'], [2, 'Car']]) {
    assert.equal(getVehicleTypeLabel(value), label);
    assert.equal(getVehicleTypeLabel(String(value)), label);
    assert.equal(getVehicleTypeLabel(label), label);
  }
  assert.equal(getVehicleTypeLabel(null), 'Vehicle');
});

test('registered vehicle type is authoritative; saved type is only a missing-vehicle fallback', () => {
  const vehicles = [{ id: 'car', vehicleType: 2 }, { id: 'motorcycle', vehicleType: 0 }];
  assert.equal(getVehicleTypeLabel(getReservationVehicleType({ vehicleId: 'car' }, vehicles)), 'Car');
  assert.equal(getVehicleTypeLabel(getReservationVehicleType({ vehicleId: 'motorcycle' }, vehicles)), 'Motorcycle');
  assert.equal(getVehicleTypeLabel(getReservationVehicleType({ vehicleId: 'car', vehicleType: 0 }, vehicles)), 'Car');
  assert.equal(getVehicleTypeLabel(getReservationVehicleType({ vehicleId: 'deleted', vehicleType: 'Car' }, vehicles)), 'Car');
  assert.equal(getVehicleTypeLabel(getReservationVehicleType({ vehicleId: 'unknown' }, vehicles)), 'Vehicle');
});

test('icons distinguish car, motorcycle and unknown vehicle types', () => {
  const Icon = load('components/ui/VehicleTypeIcon.tsx', {
    '@/constants/vehicleType': { getVehicleTypeLabel },
    './MotorcycleIcon': { MotorcycleIcon: 'motorcycle' },
    'lucide-react-native': { Car: 'car', Bike: 'bike', ParkingSquare: 'parking' },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
  }).default;
  assert.equal(Icon({ vehicleType: 2 }).type, 'car');
  assert.equal(Icon({ vehicleType: 0 }).type, 'motorcycle');
  assert.equal(Icon({ vehicleType: null }).type, 'parking');
});

test('reservation selection, confirmation and passes no longer contain literal motorcycle labels', () => {
  const page = readFileSync(new URL('../features/account/pages/SchedulePage.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /Motorcycle|motorcycle|Registered Motor\b/);
  assert.match(page, /\{activeVehicleLabel\}/);
  assert.match(page, /getReservationVehicleType\(selectedPassReservation, vehicles\)/);
});
