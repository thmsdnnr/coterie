window.onload = function() {
  let tradeRequests=window.INITIAL_STATE.suggestedTrades;
  let myTrades=window.INITIAL_STATE.userTrades;
  let bookInfoDictionary=window.INITIAL_STATE.bookInfo;

  let tReq=document.querySelector('table#tradeRequests');
  let tMine=document.querySelector('table#myTrades');

  let msg=document.querySelector('div#msg');

  if (tradeRequests.length>0) { populateTableReq(tradeRequests); }
  else {
    msg.innerHTML=`<h2>No one has requested trades with you yet.</h2><hr>`;
    tReq.style.display='none';
  }

  if (myTrades.length>0) { populateTableMine(myTrades); }
  else {
    msg.innerHTML+=`<h2>You haven't requested any trades yet.</h2> Check out <a href="/everyone">some others' shelves</a> to find some cool stuff to trade for!`;
    tMine.style.display='none';
  }

  function populateTableReq(d) {
    let tableReq=document.querySelector('table#tradeRequests tbody');
    for (let i=0;i<d.length;i++){
      let trade=d[i];
      let imgTradeFor='';
      let imgExchangeFor='';
      if(bookInfoDictionary[trade.tradeFor].volumeInfo.imageLinks!==undefined){
        imgTradeFor=`<img src="${bookInfoDictionary[trade.tradeFor].volumeInfo.imageLinks.thumbnail}" class="bookThumb">`;
      }
      if(bookInfoDictionary[trade.inExchangeFor].volumeInfo.imageLinks!==undefined){
        imgExchangeFor=`<img src="${bookInfoDictionary[trade.inExchangeFor].volumeInfo.imageLinks.thumbnail}" class="bookThumb">`;
      }
      let titleTradeFor=bookInfoDictionary[trade.tradeFor].volumeInfo.title;
      let titleExchangeFor=bookInfoDictionary[trade.inExchangeFor].volumeInfo.title;
      let tRow=document.createElement('tr');
      console.log(imgTradeFor);
      console.log(imgExchangeFor);
      tRow.innerHTML+=`<td>${trade.requestingU}</td>`;
      tRow.innerHTML+=`<td>${titleExchangeFor} ${imgExchangeFor}</td>`;
      tRow.innerHTML+=`<td>${titleTradeFor} ${imgTradeFor}</td>`;
      tRow.innerHTML+=`<td><button value="${trade['_id']}" name="ACCEPT" onclick="submit()" class="tradeDecision">YES</button> `;
      tRow.innerHTML+=`<td><button value="${trade['_id']}" name="REJECT" onclick="submit()" class="tradeDecision">NO</button>`;
      tableReq.appendChild(tRow);
    }
    tReq.style.display='inline';
  }

  function populateTableMine(d) {
    let tableMine=document.querySelector('table#myTrades tbody');
    for (let i=0;i<d.length;i++){
      let trade=d[i];
      let imgTradeFor='';
      let imgExchangeFor='';
      if(bookInfoDictionary[trade.tradeFor].volumeInfo.imageLinks!==undefined){
        imgTradeFor=`<img src="${bookInfoDictionary[trade.tradeFor].volumeInfo.imageLinks.thumbnail}" class="bookThumb">`;
      }
      if(bookInfoDictionary[trade.inExchangeFor].volumeInfo.imageLinks!==undefined){
        imgExchangeFor=`<img src="${bookInfoDictionary[trade.inExchangeFor].volumeInfo.imageLinks.thumbnail}" class="bookThumb">`;
      }
      let titleTradeFor=bookInfoDictionary[trade.tradeFor].volumeInfo.title;
      let titleExchangeFor=bookInfoDictionary[trade.inExchangeFor].volumeInfo.title;
      let tRow=document.createElement('tr');
      tRow.innerHTML+=`<td>${trade.requestedU}</td>`;
      tRow.innerHTML+=`<td>${titleTradeFor} ${imgTradeFor}</td>`;
      tRow.innerHTML+=`<td>${titleExchangeFor} ${imgExchangeFor}</td>`;
      tRow.innerHTML+=`<td>${trade.status}</td>`;
      tRow.innerHTML+=`<td><button value="${trade['_id']}" name="CANCEL" onclick="submit()" class="cancelTrade">CANCEL</button></td>`;
      tableMine.appendChild(tRow);
      console.log('appendrow');
    }
    tMine.style.display='inline';
  }
}
