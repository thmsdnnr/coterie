window.onload = function() {
  let data=window.INITIAL_STATE.data;
  let form=document.querySelector('form#uP');
  let name=document.querySelector('input[name=fullName]');
  let city=document.querySelector('input[name=city]');
  let state=document.querySelector('input[name=state]');
  (data.fullName!=='undefined') ? name.value=data.fullName : name.value='';
  (data.city!=='undefined') ? city.value=data.city : city.value='';
  (data.state!=='undefined') ? state.value=data.state : state.value='';
  if(data.city){console.log(data.city);}
  let current=document.querySelector('div#current');
  current.innerHTML+=`Full Name: ${name.value}<br />`;
  current.innerHTML+=`City: ${city.value}<br />`;
  current.innerHTML+=`State: ${state.value}<br />`;
}
