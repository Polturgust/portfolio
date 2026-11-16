// Scene files in the raytracer's own libconfig format, parsed by its CfgReader.

const camera = `camera: {
  resolution = { width = 800; height = 450; };
  position = { x = 0; y = 1; z = -2; };
  rotation = { x = 0; y = 0; z = 0; };
  fieldOfView = 60.0;
};
`

export const scenes: { id: string; name: { en: string; fr: string }; text: string }[] = [
  {
    id: 'shapes',
    name: { en: 'Shapes and shadows', fr: 'Formes et ombres' },
    text: `${camera}
primitives: {
  planes = (
    { position = { x = 0; y = -1; z = 0; }; normal = { x = 0; y = 1; z = 0; };
      color = { r = 190; g = 190; b = 200; }; }
  );
  spheres = (
    { position = { x = -2.4; y = 0.0; z = 7.0; }; radius = 1.0; color = { r = 235; g = 70; b = 70; }; },
    { position = { x = 0.0; y = 0.4; z = 9.0; }; radius = 1.4; color = { r = 10; g = 127; b = 208; }; },
    { position = { x = 2.6; y = -0.2; z = 6.5; }; radius = 0.8; color = { r = 250; g = 200; b = 70; }; }
  );
  cylinders = (
    { x = -4.6; y = -1.0; z = 10.0; axisX = 0.0; axisY = 1.0; axisZ = 0.0;
      radius = 0.8; height = 3.2; color = { r = 90; g = 200; b = 140; }; }
  );
};

lights: {
  ambient = ( { intensity = 0.25; } );
  directional = ( { x = 0.5; y = -1.0; z = 0.6; intensity = 0.8; } );
};
`,
  },
  {
    id: 'mirrors',
    name: { en: 'Mirrors', fr: 'Miroirs' },
    text: `${camera}
primitives: {
  planes = (
    { position = { x = 0; y = -1; z = 0; }; normal = { x = 0; y = 1; z = 0; };
      color = { r = 60; g = 62; b = 70; }; material = { reflection = 0.35; }; }
  );
  spheres = (
    { position = { x = 0.0; y = 0.6; z = 9.0; }; radius = 1.6;
      color = { r = 230; g = 230; b = 235; }; material = { reflection = 0.85; }; },
    { position = { x = -3.0; y = -0.2; z = 7.0; }; radius = 0.8; color = { r = 235; g = 70; b = 70; }; },
    { position = { x = 2.8; y = -0.3; z = 6.6; }; radius = 0.7; color = { r = 70; g = 200; b = 110; }; },
    { position = { x = 1.2; y = -0.5; z = 5.4; }; radius = 0.5; color = { r = 10; g = 127; b = 208; }; },
    { position = { x = -1.4; y = -0.55; z = 5.6; }; radius = 0.45;
      color = { r = 250; g = 200; b = 70; }; material = { reflection = 0.4; }; }
  );
};

lights: {
  ambient = ( { intensity = 0.2; } );
  directional = ( { x = -0.4; y = -1.0; z = 0.5; intensity = 0.6; } );
  point = ( { x = 3.0; y = 4.0; z = 4.0; intensity = 0.7; color = { r = 255; g = 235; b = 210; }; } );
};
`,
  },
  {
    id: 'lights',
    name: { en: 'Coloured lights', fr: 'Lumières colorées' },
    text: `${camera}
primitives: {
  planes = (
    { position = { x = 0; y = -1; z = 0; }; normal = { x = 0; y = 1; z = 0; };
      color = { r = 210; g = 210; b = 210; }; }
  );
  spheres = (
    { position = { x = 0.0; y = 0.2; z = 8.0; }; radius = 1.2; color = { r = 240; g = 240; b = 240; }; },
    { position = { x = -2.8; y = -0.3; z = 8.5; }; radius = 0.7; color = { r = 240; g = 240; b = 240; }; },
    { position = { x = 2.8; y = -0.3; z = 8.5; }; radius = 0.7; color = { r = 240; g = 240; b = 240; }; }
  );
  cylinders = (
    { x = 0.0; y = -1.0; z = 12.0; axisX = 0.0; axisY = 1.0; axisZ = 0.0;
      radius = 0.6; height = 4.0; color = { r = 240; g = 240; b = 240; }; }
  );
};

lights: {
  ambient = ( { intensity = 0.12; } );
  point = (
    { x = -5.0; y = 3.0; z = 5.0; intensity = 0.9; color = { r = 255; g = 60; b = 60; }; },
    { x = 5.0; y = 3.0; z = 5.0; intensity = 0.9; color = { r = 60; g = 110; b = 255; }; }
  );
};
`,
  },
]
