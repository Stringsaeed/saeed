import { PLATFORM_STORAGE_KEY } from "./platform-constants";

// Runs before the first paint, like next-themes' script: puts the stored
// platform (or a guess from the user agent) on <html>, so the fonts, radii,
// and wallpaper are right from the first frame. Also sizes the desktop
// phone to the viewport, so a short window never flashes an oversized
// device before React measures it.
const source = `(function(){
  var d=document.documentElement;
  var p=null;
  try{p=localStorage.getItem(${JSON.stringify(PLATFORM_STORAGE_KEY)})}catch(e){}
  if(p!=="ios"&&p!=="android"&&p!=="web"){
    p=/Android/i.test(navigator.userAgent)?"android":"ios";
  }
  d.dataset.platform=p;
  var h=window.innerHeight,w=window.innerWidth;
  var z=Math.min(1,(h-72)/900,(w*0.48)/452);
  d.style.setProperty("--device-zoom",String(Math.max(0.5,z).toFixed(3)));
})();`;

export function PlatformScript() {
  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static, generated at build time from constants above.
      dangerouslySetInnerHTML={{
        __html: source,
      }}
    />
  );
}
