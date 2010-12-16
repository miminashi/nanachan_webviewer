lastStatus = null;
function loadStatus() {
  var response;
  if(lastStatus) {
    $.getJSON('/twitter/status', {last_status: lastStatus}, function(data){
      console.log(data);
      renderStatus(data);
    });
  }
  else {
    $.getJSON('/twitter/status', {}, function(data){
      console.log(data);
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
    $(place).append('<div>' + imgTag + textTag + '<div style="clear:both"></div></div>');
  }
}


