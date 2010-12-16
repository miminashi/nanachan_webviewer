function post() {
  var text = $('#tweet-post-input').val();
  $('#tweet-post-input').val('送信中');
  $('#tweet-post-input').attr('disabled', 'disabled');
  $('#tweet-post-submit').attr('disabled', 'disabled');
  $.post("/twitter/update", {text: text},
  function(data){
    //console.log(data);
    if(data == 'OK') {
      $('#tweet-post-input').val('');
      $('#tweet-post-input').removeAttr('disabled');
      $('#tweet-post-submit').removeAttr('disabled');
    }
    else if(data == 'FAILED') {
      alert('送信に失敗しました. テキストが150文字を越えているかも');
      $('#tweet-post-input').val('');
      $('#tweet-post-input').removeAttr('disabled');
      $('#tweet-post-submit').removeAttr('disabled');
    }
    else {
      alert('送信に失敗しました. 原因はよくわかりません');
      $('#tweet-post-input').val('');
      $('#tweet-post-input').removeAttr('disabled');
      $('#tweet-post-submit').removeAttr('disabled');
    }
  });
}

lastStatus = null;
function loadStatus() {
  var response;
  if(lastStatus) {
    $.getJSON('/twitter/status', {last_status: lastStatus}, function(data){
      //console.log(data);
      renderStatus(data);
    }); 
  }
  else {
    $.getJSON('/twitter/status', {}, function(data){
      //console.log(data);
      renderStatus(data);
    });
  }
}

function renderStatus(data) {
  var place = '#tweets';
  var t;
  $(place).empty();
  for(var i=0; i<data.length; i++) {
    t = data[i];
    var imgTag = '<img src="' + t['user_profile_image_url'] + '" style="float:left" />';
    var textTag = '<p>' + t['user_screen_name'] + ' ' + t['text'] + '</p>';
    $(place).append('<div class="tweet">' + imgTag + textTag + '<div style="clear:both"></div></div>');
  }
}

function onBodyLoad() {
  setInterval(loadStatus, 2000);
}

