try{var params=window.location.search.substring(1).split("&");var h,t=0;for(var i=0,l=params.length;i<l;++i){var parts=params[i].split("=");
switch(parts[0]){
case"h":h=parseInt(parts[1]);break;
case"t":t=parseInt(parts[1]);break;}}
window.parent.parent.POWERREVIEWS.submission.updateIframe(h,t);
}catch(ignore){}
// BRANCH:refs/tags/2015.2.0 SHA:4b02f83608ac7b897f77fe0b06963a8441e988a6