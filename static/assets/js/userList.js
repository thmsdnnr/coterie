window.onload=function() {
  let c=document.querySelector('div#parentContainer');
  let users=window.INITIAL_STATE.users;
  if (users.length) {
    for (var i=0;i<users.length;i++) {
      let u=users[i];
      let user=u.username;
      let city=u.city;
      let name=u.fullName;
      let state=u.state;
      let numB=u.booksOwned.length;
      let bookWord;
      (numB===1) ? bookWord='book' : bookword='books';
      (city) ? null : city='';
      (name===undefined) ? name='' : null;
      (state) ? null : state='';
      let locString;
      (city&&state) ? locString=`from: ${city}, ${state}` : null;
      let d=document.createElement('div');
      d.id='child';
      d.innerHTML+=`<h1><a href="/u/${user}">${user}</a></h1> currently has ${users[i].booksOwned.length} ${bookword}!<br />`;
      if((name||city)||state){d.innerHTML+=`(PROFILE: ${name} ${city} ${state})`;}
      c.appendChild(d);
    }
  }
}
