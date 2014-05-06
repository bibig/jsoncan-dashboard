var jd = {};

// for delete action
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
      alert(data.responseJSON.error);
    });

    jqXHR.done(function (data) {
      window.location = data.redirect;
    });

    // jqxhr.always(function () {alert("always");});
  }
};

jd.onlySubmitOnce = function (formId, btnId) {
  $('#' + formId).on('submit',function (e) {
    var $form = $(this);
    if ($form.data('submitted') === true) {
      // Previously submitted - don't submit again
      e.preventDefault();
    } else {
      $('#' + btnId).val('提交中...').attr('disabled', 'disabled');
      // Mark it so that the next submit can be ignored
      $form.data('submitted', true);
    }
  });

  // Keep chainability
  return this;
};

jd.richText = function (names, mount) {
  if (! names ) { return; }
  
  tinymce.init({
    selector: names,
    language : 'zh_CN',
    language_url : mount + '/langs/tinymce_zh_CN.js',
    content_css : mount + '/stylesheets/tinymce_content.css',
    menu : {
        file   : {},
        edit   : {title : 'Edit'  , items : 'undo redo | cut copy paste pastetext | selectall'},
        insert : {title : 'Insert', items : 'link media | template hr'},
        format : {title : 'Format', items : 'bold italic underline strikethrough superscript subscript | formats | removeformat'},
        table  : {title : 'Table' , items : 'inserttable tableprops deletetable | cell row column'}
    },
    plugins: [
        "advlist autolink lists link image charmap print preview anchor",
        "searchreplace visualblocks code fullscreen",
        "insertdatetime media table contextmenu paste"
    ],
    toolbar: "undo redo | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image"
  });
};