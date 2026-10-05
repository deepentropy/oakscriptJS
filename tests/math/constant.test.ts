import { math } from '../../src';

// values measured in PineScript scripts (#151): constant expression -> plotted value
describe('math.constant (PineScript constant expressions, #151)', () => {
  it('rounds the exact value to 16 decimals from 0.001 up', () => {
    expect(math.constant(1 / 255)).toBe(0.003921568627451);
    expect(math.constant(1 / 7)).toBe(0.1428571428571428);
    expect(math.constant(-1 / 7)).toBe(-0.1428571428571428);
    expect(math.constant(1 / 6)).toBe(0.1666666666666667);
    expect(math.constant(1 / 18)).toBe(0.0555555555555556);
    expect(math.constant(1 / 2.2)).toBe(0.4545454545454545);
    expect(math.constant(1 / 1000)).toBe(0.001);
    expect(math.constant(1 / 999.99)).toBe(0.0010000100001);
    expect(math.constant(0.0010000000000000002)).toBe(0.001);
  });

  it('ties go to the even digit', () => {
    expect(math.constant(133 / 131072)).toBe(0.0010147094726562);
    expect(math.constant(135 / 131072)).toBe(0.0010299682617188);
    expect(math.constant(-133 / 131072)).toBe(-0.0010147094726562);
    expect(math.constant(-135 / 131072)).toBe(-0.0010299682617188);
    expect(math.constant(32769 / 131072)).toBe(0.2500076293945312);
    expect(math.constant(32771 / 131072)).toBe(0.2500228881835938);
  });

  it('keeps values below 0.001, from 0.5 up, na and the values with 16 decimals or fewer', () => {
    expect(math.constant(0.0009999999999999998)).toBe(0.0009999999999999998);
    expect(math.constant(1 / 1000.01)).toBe(0.000999990000099999);
    expect(math.constant(57.2656 / 512053)).toBe(0.0001118352982991995);
    expect(math.constant(1 / 3e10)).toBe(3.3333333333333335e-11);
    expect(math.constant(1 / 3)).toBe(0.3333333333333333);
    expect(math.constant(2 / 3)).toBe(2 / 3);
    expect(math.constant(1000 / 3)).toBe(1000 / 3);
    expect(math.constant(1e300 / 3)).toBe(1e300 / 3);
    expect(math.constant(NaN)).toBeNaN();
    expect(math.constant(Infinity)).toBe(Infinity);
  });

  it('a whole expression is rounded once', () => {
    expect(math.constant((1 / 7) * 7)).toBe(1);
    expect(math.constant(1 / 7 + 1 / 7)).toBe(0.2857142857142857);
  });

  it('math functions of constants (#130 constant results)', () => {
    expect(math.constant(math.sqrt(0.1))).toBe(0.3162277660168379);
    expect(math.constant(math.sqrt(0.001))).toBe(0.0316227766016838);
    expect(math.constant(math.sin(0.1))).toBe(0.0998334166468282);
    expect(math.constant(math.log(2) / math.log(10))).toBe(0.3010299956639811);
    expect(math.constant(math.log(0.1) / math.log(10))).toBe(-0.9999999999999998);
  });
});
