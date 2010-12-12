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

