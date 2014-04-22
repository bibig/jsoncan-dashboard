var jd = {};

jd.setCsrf = function (token) {
  $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
    jqXHR.setRequestHeader('X-CSRF-Token', token);
  });
};

jd.del = function (url) {
  var jqXHR;

  if ( confirm('您确定要删除这条记录?') ) {
    jqXHR = $.ajax({
      url: url,
      type: "DELETE"
    });

    jqXHR.fail(function (data) { 
      console.log(data);
      alert(data.responseJSON.error);
    });

    jqXHR.done(function (data) {
      window.location = data.redirect;
    });

    // jqxhr.always(function () {alert("always");});
  }
};

jd.onlySubmitOnce = function (formId, btnId) {
  $('#' + formId).on('submit',function(e){
    var $form = $(this);

    if ($form.data('submitted') === true) {
      $('#' + btnId).val('提交中...').attr('disabled', 'disabled');
      // Previously submitted - don't submit again
      e.preventDefault();
    } else {
      // Mark it so that the next submit can be ignored
      $form.data('submitted', true);
    }
  });

  // Keep chainability
  return this;
};