window.onload = function() {
  let tradeOptions=false;
  let tradeResult;
  let resultsPerPage=10; //this is page #

  let data=window.INITIAL_STATE;
  let q=window.INITIAL_STATE.query;
  if (data.books.length) { renderTable(data.books); }
  else {
      let cont=document.querySelector('div#container');
      cont.innerHTML=`This user does not have any books right now.`;
  }

  function requestMoreResults(query) {
 //we multiply by results-per-page serverside
    q.startIndex++;
    fetch('/s',{
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      method: "POST",
      credentials: "include",
      body: `qText=${query.qText}&qParam=${query.qParam}&startIndex=${q.startIndex}`
    }).then(response=>{
      return response.json();
    }).then(parsed_result=>{
      renderTable(parsed_result.books);
      window.scrollTo(0,0); //scroll back to the top after we re-render the page
    });
  }

  function addToShelf(gid) {
    fetch('/addToShelf',{
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      method: "POST",
      credentials: "include",
      body: `gid=${gid}&user=${data.user}`
    }).then(response=>{
  });
}

function proposeTrade(gid) {
  let message=document.querySelector('div#msg');
  let title=document.querySelector(`span#title${gid}`).innerHTML;
  fetch('/proposeTrade',{
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    method: "POST",
    credentials: "include",
    body: `userRequestedFromBookID=${gid}&userRequesting=${data.user}&userRequestedFrom=${data.pageUser}&tradeForName=${title}`
  }).then(response=>{
      return response.json();
    }).then(parsed_result=>{ //list user's current books available to trade
      tradeResult=parsed_result;
      tradeOptions=true;
      if(parsed_result.books.length>1) {
        message.innerHTML=`<h2>Select which book you would like to offer to trade for ${tradeResult.tradeForName}.</h2>`;
        renderTable(parsed_result.books);
      }
      else {
        message.innerHTML=`<h2>Sorry, but you don't have any books to offer to trade for ${tradeResult.tradeForName}.</h2>`;
      }
      tradeOptions=false;
      window.scrollTo(0,0);
});
}

function completeTradeRequest(gid) {
  console.log('completeTradeRequest');
  let message=document.querySelector('div#msg');
  let title=document.querySelector(`span#title${gid}`).innerHTML;
  fetch('/completeTradeRequest',{
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    method: "POST",
    credentials: "include",
    body: `userRequestedFromBookID=${gid}&userRequesting=${data.user}&userRequestedFrom=${data.pageUser}&userRequestingBookID=${tradeResult.tradeFor}`
  }).then(response=>{ //TODO what should this do
      tradeOptions=false;
      let bR=document.querySelector('table#bookResults');
      bR.style.display='none';
      message.innerHTML=`<p>We've contacted the user with your trade request. Keep track of its status <a href="/trades">here</a>. GOOD LUCK!</p>`;
      window.scrollTo(0,0);
});
}

  function renderTable(d) {
    console.log(tradeOptions);
    data=window.INITIAL_STATE;
    let bTable=document.querySelector('table#bookResults tbody');
    bTable.innerHTML=null;
    for (var i=0;i<d.length;i++) {
      let book=d[i];
      let bID = book.id || book.gid;
      let row=document.createElement('tr');
      //check elements if existing and if so add them
      let title=book.volumeInfo.title;
      let subtitle;
      (book.volumeInfo.subtitle) ? subtitle=book.volumeInfo.subtitle : subtitle='';
      let thumbnail;
      (book.volumeInfo.imageLinks) ? thumbnail=`<img src="${book.volumeInfo.imageLinks.smallThumbnail}" class="bookThumb">` : thumbnail=`no image`;
      let authors=`<ul>`;
      if(book.volumeInfo.authors) {
        book.volumeInfo.authors.forEach((a)=>authors+=`<li>${a}</li>`);
        authors+=`</ul>`;
      }
      else { authors=''; }
      let description;
      (book.volumeInfo.description) ? description=book.volumeInfo.description : description=`no description`;
      //build the row
      row.innerHTML+=`<td><b><span id="title${bID}">${title}</span></b><br />${subtitle}<br /></td>`;
      row.innerHTML+=`<td>${authors}</td>`;
      row.innerHTML+=`<td>${thumbnail}</td>`;
      row.innerHTML+=`<td><div id="description">${description}</div></td>`;

      //add potential actions depending on whether this is a search query or a display of a user's shelf
      if (q) { //if this is a search query add option to ADD TO BOOKSHELF.
        //Otherwise you're requesting a trade or looking at your own books.
        row.innerHTML+=`<td><a href="#" id="${bID}" class="addToShelf">ADD TO MY BOOKS</a>`;
        row.innerHTML+=`<td><a href="${book.accessInfo.webReaderLink}" target="_new"><img src="/assets/images/gbs_preview.png"></a></td>`;
      }
      else {
        row.innerHTML+=`<td></td>`;
        if ((data.pageUser!==data.user)&&(!tradeOptions)) { //you cannot trade with yourself
          row.innerHTML+=`<td><a href="#" id="${bID}" class="trade">propose trade</a></td>`;
        }
        else if((data.pageUser!==data.user)&&(tradeOptions)) { row.innerHTML+=`<td><a href="#" id="${bID}" class="tradeFor">TRADE FOR ${tradeResult.tradeForName}</td>`; }
        else {
          row.innerHTML+=`<td></td>`;
        }
      // this is a user-defined book, so don't show a "Read on Google Books" link
      if (book._id===book.gid) { row.innerHTML+=`<td></td>`; }
      else { row.innerHTML+=`<td><a href="${book.accessInfo.webReaderLink}" target="_new"><img src="/assets/images/gbs_preview.png"></a></td>`; }
      }
    bTable.appendChild(row); //add to the table
  //add if statement here to only display "more" if books.totalItems > startAtIndex*items-per-page
  }
  if (q) { //if this is a search and not a simple list
    if (Math.floor((data.totalItems/resultsPerPage))>data.query.startIndex) {
      //IF there are more results to show on the next page, provide a link to click to display them.
      let moreResults=document.createElement('span');
      moreResults.innerHTML=`<a href="#" id="nextResults">MORE RESULTS</a>`;
      let more=document.querySelector('div#more');
      more.innerHTML=null;
      more.append(moreResults);
      let nextRes = document.getElementById('nextResults');
      nextRes.addEventListener('click',requestMore);
    }
    let addLinks=document.querySelectorAll('a.addToShelf');
    addLinks.forEach((link)=>link.addEventListener('click',handleAdd));
  }
    let tradeLinks=document.querySelectorAll('a.trade');
    tradeLinks.forEach((link)=>link.addEventListener('click',handleTrade));
    if (tradeOptions){
      let tradeFor=document.querySelectorAll('a.tradeFor');
      tradeFor.forEach((link)=>link.addEventListener('click',handleTradeFinish));
    }
  }

    function requestMore(e){
      e.preventDefault();
      requestMoreResults(q);
    }
    function handleAdd(e){addToShelf(e.target.id); }
    function handleTrade(e){ proposeTrade(e.target.id); }
    function handleTradeFinish(e){ completeTradeRequest(e.target.id); }
  }
