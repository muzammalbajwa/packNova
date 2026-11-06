# Re-exporting the poster and social image

Both images are rendered from the live 3D scene. Run `npm run dev`, open the home page, and in the browser console:

```js
// 1. Render the hero box (closed, initial pose) to a transparent square.
window.scrollTo(0, 0);
const { gl, scene, camera, size } = window.__r3f;
const root = scene.children.find((c) => c.type === "Group");
const [w0, h0, pr] = [size.width, size.height, gl.getPixelRatio()];
gl.setPixelRatio(1); gl.setSize(1000, 1000, false);
camera.aspect = 1; camera.zoom = 1.25; camera.updateProjectionMatrix();
root.position.set(0, -0.62 * 0.82 + 0.18, 0); root.rotation.set(0.18, 0.55, 0); root.scale.setScalar(0.82);
gl.render(scene, camera);
const webp = gl.domElement.toDataURL("image/webp", 0.9); // -> public/textures/hero-poster.webp
const png = gl.domElement.toDataURL("image/png");        // use as the box in og.png
gl.setPixelRatio(pr); gl.setSize(w0, h0, false); camera.aspect = w0 / h0; camera.zoom = 1; camera.updateProjectionMatrix();
```

Save the data URLs as files (decode base64). `public/og.png` is 1200x630: dark background (#0b0a09), an orange radial
glow, the box PNG on the right, and the brand name, headline and tagline drawn with a 2D canvas on the left.
