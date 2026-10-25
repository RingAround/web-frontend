export const THEME_STORAGE_KEY = "ringaround:theme";

// Runs in <head> before first paint so a saved dark theme never flashes light.
export const themeScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;
