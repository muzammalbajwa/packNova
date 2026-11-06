# Testing on a real phone

Desktop numbers say little about a mid-range Android phone. Test the **production build** on your phone over your Wi-Fi.

## 1. Build and serve ./out on your network

```bash
cd /Users/wasiq/Desktop/development/code/packaging3D
nvm use 22
npm run build            # creates ./out
npm run serve:out        # serves ./out on 0.0.0.0:8080 (all network interfaces)
```

Find your computer's Wi-Fi address (it changes between networks):

```bash
ipconfig getifaddr en0   # when this was written it printed 192.168.100.99
```

On the phone (same Wi-Fi), open **`http://<that address>:8080/`**, for example `http://192.168.100.99:8080/`.

Notes:
- If it does not load, check the phone is on the same Wi-Fi (not mobile data or a guest network) and that the macOS firewall allows Python to accept incoming connections.
- This simple server does **not** compress files, so the first load is heavier than it will be on Cloudflare (which uses Brotli/gzip). Treat load time here as a worst case.
- Stop the server with Ctrl+C. Do not leave it running on public Wi-Fi.
- For a real-network test with compression and caching, use a Cloudflare preview URL instead (see `DEPLOY.md`).

## 2. Turn on the stats overlay

Add `?debug=1` to the address, e.g. `http://192.168.100.99:8080/?debug=1`. A small panel shows fps, worst frame time,
draw calls, triangles, device tier and whether WebGL is on. To force a tier for comparison add `&tier=low`, `&tier=mid` or `&tier=none`.

## 3. Checklist

Write down what you see. "Smooth" means no visible stutter while scrolling.

**Loading**
- [ ] Time from tapping Go to seeing the page text (count seconds)
- [ ] Time until the 3D box appears and the loader disappears
- [ ] Does the loader ever get stuck? (It must clear within about 8 seconds.)
- [ ] Which tier does the overlay report? (`low` is expected on many Android phones.)

**Home page**
- [ ] Hero: scrolling opens the box smoothly (fps in the overlay, ideally 30+)
- [ ] Story scenes (Design, Print, Deliver): the box changes without stutter
- [ ] Marquee, product cards and the quote form scroll smoothly
- [ ] Phone gets warm or loses battery noticeably after about 2 minutes of scrolling?
- [ ] Any text cut off or overlapping at your phone's width? Rotate to landscape too.

**Configurator** (`/configurator/`)
- [ ] Drag with one finger rotates the box; page scrolling still works when you drag outside the canvas
- [ ] Pinch zooms but stops at the limits
- [ ] Moving the size sliders does not freeze the preview
- [ ] Open / Close animates for the carton, folding carton and rigid box
- [ ] Upload a PNG and a JPG from your phone gallery; try a file over 10 MB and a non-image (both should show an error)
- [ ] Text and color on a panel appear on the box
- [ ] "Request a quote" opens WhatsApp with the spec filled in (you must press send there)

**Fallbacks**
- [ ] `?tier=none` shows the 2D page with all text and a working quote form
- [ ] `?tier=low` still looks acceptable

## 4. What to send back

Phone model, Android/iOS version, browser, the tier shown in the overlay, typical fps on the hero and in the configurator,
seconds to first text and to the 3D scene, and anything that stuttered, got hot or looked wrong.
