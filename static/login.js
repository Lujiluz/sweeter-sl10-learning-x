$(document).ready(function () {
  // $('input').keyup(function (e) {
  //   if ($(this).val() !== '') {
  //     $(this).removeClass('is-danger');
  //     console.log($(`${$(this).prop('id')}-empty`));
  //   }
  // });
});

const log_in = () => {
  event.preventDefault();
  let username = $('#username').val();
  let password = $('#password').val();

  if (username === '') {
    $('.username-empty').removeClass('is-hidden');
    $('#username').addClass('is-danger');
    $('#username').focus();
    return;
  } else {
    $('.username-empty').addClass('is-hidden');
    $('#username').removeClass('is-danger');
  }

  if (password === '') {
    $('.password-empty').removeClass('is-hidden');
    $('#password').addClass('is-danger');
    $('#password').focus();
    return;
  } else {
    $('.password-empty').addClass('is-hidden');
    $('#password').removeClass('is-danger');
  }

  console.log(username, password);

  $.ajax({
    type: 'POST',
    url: '/login',
    data: {
      username,
      password,
    },
    success: function (response) {
      console.log(response);
      if (response['result'] == 'success') {
        $.cookie('mytoken', response['token'], { path: '/' });
        alert('Login complete!');
        window.location.href = '/';
      } else {
        alert(response['msg']);
      }
    },
  });
};
