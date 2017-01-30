window.onload = function() {
  let data=window.INITIAL_STATE.data;
  let form=document.querySelector('form#uP');
  let name=document.querySelector('input[name=fullName]');
  let city=document.querySelector('input[name=city]');
  let state=document.querySelector('input[name=state]');
  name.value=data.fullName;
  city.value=data.city;
  state.value=data.state;

  let current=document.querySelector('div#current');
  current.innerHTML+=`Full Name: ${data.fullName}<br />`;
  current.innerHTML+=`City: ${data.city}<br />`;
  current.innerHTML+=`State: ${data.state}<br />`;
}
