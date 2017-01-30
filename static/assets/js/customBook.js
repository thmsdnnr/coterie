window.onload=function() {
  let form=document.querySelector('form#customBook');
  let title=document.querySelector('input[name=title]');
  let author=document.querySelector('input[name=author]');
  let description=document.querySelector('input[name=description]');

  form.addEventListener('submit',handleSubmit);

  function handleSubmit(e){
    e.preventDefault();
    fetch('/addBook',{
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      method: "POST",
      credentials: "include",
      body: `title=${title.value}&author=${author.value}&description=${description.value}`
    }).then(response=>{
      if (response.status===200) {
        //show client "SUCCESSFULLY UPATED" message
      }
      else {
        //show client "huh something went wrong" message
      }
    });
  }
}
