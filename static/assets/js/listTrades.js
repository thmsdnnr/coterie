window.onload = function() {
  let tradeRequests=window.INITIAL_STATE.suggestedTrades;
  let myTrades=window.INITIAL_STATE.userTrades;
  let bookInfoDictionary=window.INITIAL_STATE.bookInfo;

  let msg=document.querySelector('div#msg');

  (tradeRequests.length>0) ? populateTableReq(tradeRequests) : msg.innerHTML=`<h1>No trade requests at this time.</h1>`;
  (myTrades.length>0) ? populateTableMine(myTrades) : msg.innerHTML+=`<h1>You haven't requested any trades yet.</h1> Check out <a href="/everyone">some others' shelves</a> to find some cool stuff to trade for!`;

  function tableReq(d) {

  }

  function populateTableReq(d) {
    let tableReq=document.querySelector('table#tradeRequests tbody');
    for (let i=0;i<d.length;i++){
      let trade=d[i];
      let imgTradeFor=bookInfoDictionary[trade.tradeFor].volumeInfo.imageLinks.thumbnail;
      let titleTradeFor=bookInfoDictionary[trade.tradeFor].volumeInfo.title;
      let imgExchangeFor=bookInfoDictionary[trade.inExchangeFor].volumeInfo.imageLinks.thumbnail;
      let titleExchangeFor=bookInfoDictionary[trade.inExchangeFor].volumeInfo.title;
      let tRow=document.createElement('tr');
      (imgTradeFor) ? imgTradeFor=`<img src="${imgTradeFor}">` : imgTradeFor='';
      (imgExchangeFor) ? imgExchangeFor=`<img src="${imgExchangeFor}">` : imgExchangeFor='';
      tRow.innerHTML+=`<td>${trade.requestingU}</td>`;
      tRow.innerHTML+=`<td>${titleExchangeFor} ${imgExchangeFor}</td>`;
      tRow.innerHTML+=`<td>${titleTradeFor} ${imgTradeFor}</td>`;
      tRow.innerHTML+=`<td><a href="#" id="${trade['_id']}" class="decision" name="ACCEPT">YES</a> | `;
      tRow.innerHTML+=`<td><a href="#" id="${trade['_id']}" class="decision" name="REJECT">NO</a>`;
      tableReq.appendChild(tRow);
    }
    document.querySelectorAll('a.decision').forEach((link)=>{
      link.addEventListener('click',handleTradeChange);
    });
  }


  function tableMineHeaders(d) {

  }

  function populateTableMine(d) {
    let tableMine=document.querySelector('table#myTrades tbody');
    for (let i=0;i<d.length;i++){
      let trade=d[i];
      let imgTradeFor=bookInfoDictionary[trade.tradeFor].volumeInfo.imageLinks.thumbnail;
      let titleTradeFor=bookInfoDictionary[trade.tradeFor].volumeInfo.title;
      let imgExchangeFor=bookInfoDictionary[trade.inExchangeFor].volumeInfo.imageLinks.thumbnail;
      let titleExchangeFor=bookInfoDictionary[trade.inExchangeFor].volumeInfo.title;
      let tRow=document.createElement('tr');
      (imgTradeFor) ? imgTradeFor=`<img src="${imgTradeFor}">` : imgTradeFor='';
      (imgExchangeFor) ? imgExchangeFor=`<img src="${imgExchangeFor}">` : imgExchangeFor='';
      tRow.innerHTML+=`<td>${trade.requestedU}</td>`;
      tRow.innerHTML+=`<td>${titleTradeFor} ${imgTradeFor}</td>`;
      tRow.innerHTML+=`<td>${titleExchangeFor} ${imgExchangeFor}</td>`;
      tRow.innerHTML+=`<td>${trade.status}</td>`;
      tRow.innerHTML+=`<td><a href="#" id="${trade['_id']}" class="cancel" name="CANCEL">CANCEL</a></td>`;
      tableMine.appendChild(tRow);
    }
    document.querySelectorAll('a.cancel').forEach((link)=>{
      link.addEventListener('click',handleTradeChange);
    });
  }

  function handleTradeChange(e) { postTradeUpdate({id:e.target.id,action:e.target.name}); }

  function postTradeUpdate(params) {
    fetch('/trades',
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      method: "POST",
      credentials: "include",
      body: `id=${params.id}&action=${params.action}`
    }).then(response=>{ //TODO respond meanignfully
       });
  }

}
