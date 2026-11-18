import paths from '../../icons/ace-icons.json';
export function AceIcon({name,size=18}: {name:keyof typeof paths;size?:number}) {
  return <svg className="ace-icon" style={{width:size,height:size}} viewBox="0 0 24 24" aria-hidden="true">{(paths[name]||paths.info).map((d,i)=><path key={i} d={d}/>)}</svg>;
}
