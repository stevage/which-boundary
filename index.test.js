const which = require('./index');

test('Point in Yarra LGA', () => {
    const boundary = which.lgaByLonLat(145,-37.8);
    expect(boundary.name).toBe('Yarra (C)');
});

test('Point in Melbourne ELB', () => {
    const boundary = which.elbByLonLat(145,-37.8);
    console.log(boundary);
    expect(boundary.name).toBe('MELBOURNE');
});


test('Point in Canberra ELB', () => {
    const boundary = which.elbByLonLat(149.13, -35.28);
    expect(boundary.name).toBe('CANBERRA');
});
