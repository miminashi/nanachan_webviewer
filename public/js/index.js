// 読み込み済みの最新のtweetのid
var lastStatus = null;

function post() {
  var text = $('#tweet-post-input').val();
  //$('#tweet-post-input').val('送信中');
  $('#tweet-post-input').attr('disabled', 'disabled');
  $('#tweet-post-submit').attr('disabled', 'disabled');
  $.ajax({
    type: "POST",
    url: "/twitter/update",
    data: {text: text},
    dataType: "text",
    timeout: 10000,
    success: function(data, dataType){
      resetTextInputUiState();
    },
    error: function(xmlHttpRequest, textStatus, errorThrown){
      var responseText = xmlHttpRequest['responseText'];
      if(textStatus == 'error') {
        switch(responseText) {
          case 'text too long':
            alert('テキストが150文字を超えています');
            break;
          case 'empty text':
            alert('空っぽですよ');
            break;
        }
      }
      //resetTextInputUiState();
      unlockTextInputUi();
    },
  });
}

function lockTextInputUi() {
  $('#tweet-post-input').attr('disabled', 'disabled');
  $('#tweet-post-submit').attr('disabled', 'disabled');
}

function unlockTextInputUi() {
  $('#tweet-post-input').removeAttr('disabled');
  $('#tweet-post-submit').removeAttr('disabled');
}

function resetTextInputUiState() {
  $('#tweet-post-input').val('');
  unlockTextInputUi();
}

function clearValue() {
  $('#tweet-post-input').val('');
}

function loadStatus() {
  var response;
  var params;
  var handler;
  if(lastStatus) {
    params = {last_status: lastStatus};
    handler = function(data, dataType){
      renderStatus(data);
    }
  }
  else {
    params = {};
    handler = function(data, dataType){
      $('#tweets').empty();
      renderStatus(data);
    };
  }
  //$.getJSON('/twitter/status', params, handler);
  $.ajax({
    type: "GET",
    url: "/twitter/status",
    data: params,
    dataType: "json",
    timeout: 10000,
    success: handler,
    error: function(xmlHttpRequest, textStatus, errorThrown){
      bookLoadStatus();
    },
  });
}

function renderStatus(_data) {
  var newest = _data[0];
  var data = _data.reverse();
  if(newest) {
    lastStatus = newest['tweet_id'];
  }
  var place = '#tweets';
  var t;
  //$(place).empty();
  for(var i=0; i<data.length; i++) {
    t = data[i];
    var imgTag = '<img src="' + t['user_profile_image_url'] + '" />';
    var textTag = '<p class="tweet-text">' + t['user_screen_name'] + ' ' + t['text'] + '</p>';
    var menuTag = '<p class="tweet-menu">'
                + '<a href="#" onclick="replay(\'' + t['user_screen_name'] + '\', \'' + t['tweet_id'] + '\')" onmouseover="tipsReplay(this)">RE</a>'
                + '&nbsp'
                + '<a href="#" onclick="retweet(\'' + t['user_screen_name'] + '\', \'' + t['tweet_id'] + '\', \'' + t['text'] +'\')" onmouseover="tipsRetweet(this)">RT</a>'
                + '&nbsp'
                + '<a href="#" onclick="quateRetweet(\'' + t['user_screen_name'] + '\', \'' + t['text'] + '\')" onmouseover="tipsQuateRetweet(this)">qRT</a>'
                + '</p>';
    var clearTag = '<div class="clear">';
    if(loggedIn) {
      $(place).prepend('<div class="tweet">' + imgTag + textTag + menuTag + clearTag + '</div></div>');
    }
    else {
      $(place).prepend('<div class="tweet">' + imgTag + textTag + clearTag + '</div></div>');
    }
  }
  // 表示が終わったら2秒待ってから再度loadStatus()を実行
  bookLoadStatus();
}

function bookLoadStatus() {
  setTimeout("loadStatus()", 2000);
}

function replay(screen_name, tweet_id) {
  var val = $('#tweet-post-input').val();
  $('#tweet-post-input').val('@' + screen_name + ' ' + val);
}

function retweet(screen_name, tweet_id, text) {
  lockTextInputUi();
  var res = window.confirm(screen_name + ': "' + text + '" をRTしますか？');
  var successHandler = function(data, dataType) {
    unlockTextInputUi(); 
  };
  var errorHandler = function(xmlHttpRequest, textStatus, errorThrown) {
    alert('RTできませんでした');
    unlockTextInputUi();
  };
  var params = {id: tweet_id};
  if(res) {
    $.ajax({
      type: "POST",
      url: "/twitter/retweet",
      data: params,
      dataType: "text",
      timeout: 10000,
      success: successHandler,
      error: errorHandler
    });   
  }
  else {
    unlockTextInputUi();
  }
}

function quateRetweet(screen_name, text) {
  var val = 'RT @' + screen_name + ': ' + text;
  $('#tweet-post-input').val(val);
}

function tipsReplay(obj) {
  showTips(obj, '返信(Mention)');
}

function tipsRetweet(obj) {
  showTips(obj, 'リツィート(ReTweet)');
}

function tipsQuateRetweet(obj) {
  showTips(obj, '引用付きリツィート(QuateReTweet)');
}

function showTips(obj, msg) {
  var scrollTop = $('#tweets').scrollTop();
  obj.onmouseout = clearTips;
  var x = obj.offsetLeft + 8;
  var y = obj.offsetTop + 28 - scrollTop;
  var tag = '<div class="tips" style="left:' + x + 'px; top:' + y + 'px;">' + msg + '</div>';
  $('body').append(tag);
}

function clearTips() {
  $('.tips').remove();
}

function onBodyLoad() {
  //setInterval(loadStatus, 2000);
  loadStatus();
}

