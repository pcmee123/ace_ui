import { useState, useEffect } from 'react';
type Theme='dark'|'light'|'sage'|'eye';
const choices: [Theme,string][]=[['dark','石墨深色'],['light','清透浅色'],['sage','豆沙绿'],['eye','深绿护眼']];
export function AceThemeSwitch(){
  const [theme,setTheme]=useState<Theme>('dark');
  useEffect(()=>{const current=document.documentElement.dataset.aceTheme;if(choices.some(([key])=>key===current))setTheme(current as Theme);},[]);
  function apply(value:Theme){setTheme(value);document.documentElement.dataset.aceTheme=value;try{localStorage.setItem('ace-ui.theme',value);}catch{}}
  return <div className="ace-segment" aria-label="外观主题">{choices.map(([key,label])=><button type="button" key={key} aria-pressed={theme===key} onClick={()=>apply(key)}>{label}</button>)}</div>;
}
