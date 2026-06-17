---
"vaul-vue": patch
---

fix(ssr): guard `document` access in `useScaleBackground`

`useScaleBackground()` read `document.body.style.backgroundColor` synchronously
at composable-call time. Because `DrawerContent` calls it during `setup()`, this
crashed server-side rendering with `document is not defined`. The read is now
guarded with `typeof document !== 'undefined'`; the surrounding `watchEffect`
never runs during SSR, so client behaviour is unchanged.
