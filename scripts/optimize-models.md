# Optimizing 3D assets

Targets: hero GLB < 3 MB, draw calls < 100, textures as KTX2.
All tools are dev dependencies (`npx gltf-transform`, `npx gltfpack`).

## 1. Mesh compression (pick one)

Draco (smallest, needs the Draco decoder at runtime; drei serves it from a CDN by default,
copy `node_modules/three/examples/jsm/libs/draco/gltf/` to `public/draco/` to self-host):

    npx gltf-transform optimize input.glb public/models/box.glb \
      --compress draco --texture-compress ktx2 --texture-size 2048

Meshopt (faster to decode on low-end phones, slightly larger):

    npx gltf-transform optimize input.glb public/models/box.glb \
      --compress meshopt --texture-compress ktx2 --texture-size 2048

## 2. Texture compression to KTX2 (needs the `toktx` binary from KTX-Software)

    npx gltf-transform etc1s input.glb out.glb          # small, for albedo / AO
    npx gltf-transform uastc input.glb out.glb          # higher quality, for normal maps

Standalone textures:

    toktx --t2 --encode etc1s --genmipmaps public/textures/kraft.ktx2 kraft.png

## 3. gltfpack alternative (meshopt + KTX2 in one pass)

    npx gltfpack -i input.glb -o public/models/box.glb -cc -tc -si 0.5

## 4. Reduce draw calls

    npx gltf-transform join input.glb joined.glb        # merge meshes with same material
    npx gltf-transform instance joined.glb out.glb      # turn repeats into GPU instances

## 5. Check the result

    npx gltf-transform inspect public/models/box.glb

Loading in R3F: `useGLTF("/models/box.glb")` (drei handles Draco / meshopt),
and `useKTX2` for standalone textures. Call `useGLTF.preload(...)` for the hero model.
