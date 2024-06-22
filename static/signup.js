$(document).ready(function () {
  sign_up();
});

const sign_up = () => {
  // event listener for signup button
  $('#signup-btn').click(function (e) {
    e.preventDefault();
    let username = $('#username').val();
    let pw = $('#password').val();
    let pw2 = $('#re-enter-password').val();

    if (username === '') {
      $('.username-empty').removeClass('is-hidden');
      return;
    } else {
      $('.username-empty').addClass('is-hidden');
    }

    if (pw === '') {
      $('.pw-empty').removeClass('is-hidden');
      $('#password').focus();
      return;
    } else if (pw2 === '') {
      $('.pw-2-empty').removeClass('is-hidden');
      $('#re-enter-password').focus();
      return;
    } else {
      $('.pw-2-empty').addClass('is-hidden');
      $('.pw-empty').addClass('is-hidden');
    }

    // if pw1 and pw2 is not the same
    if (pw !== pw2) {
      $('pw-2-notSame').removeClass('is-hidden');
      return;
    } else {
      $('pw-2-notSame').addClass('is-hidden');
    }

    $.ajax({
      type: 'POST',
      url: '/sign_up/save',
      data: {
        username,
        pw,
      },
      success: function (response) {
        alert('sign up successfully!');
        window.location.replace('/login');
      },
    });
  });
  // end of event listener for signup button

  // event listener: username input tag
  $('#username').keyup(function (e) {
    e.preventDefault();
    let text = $(this).val();
    if (is_username(text)) {
      $('.username-requirements').hide();
    } else {
      $('.username-requirements').show();
    }
  });

  $('#username').blur(function (e) {
    e.preventDefault();
    let username = $(this).val();
    $('.username-control').addClass('is-loading');
    $.ajax({
      type: 'POST',
      url: '/sign_up/check_dup',
      data: { username },
      success: function (res) {
        if (res.isExisted) {
          $('.username-existed').removeClass('is-hidden');
          $('.username-control').removeClass('is-loading');
          $('#username').addClass('is-danger');
        } else {
          $('.username-existed').addClass('is-hidden');
          $('.username-control').removeClass('is-loading');
          $('#username').removeClass('is-danger');
          $('#username').addClass('is-success');
        }
      },
    });
  });
  // end of event listener: username input tag

  // event listener for password validation
  $('#password').keyup(function (e) {
    e.preventDefault();
    if ($(this).val() === '') {
      $('#re-enter-password').attr('disabled', 'disabled');
    } else {
      $('.pw-empty').addClass('is-hidden');
      $('#re-enter-password').removeAttr('disabled');
    }
    // validate password format
    if (is_password($(this).val())) {
      $('.pw-requirements').hide();
    } else {
      $('.pw-requirements').show();
    }
  });

  $('#re-enter-password').keyup(function (e) {
    e.preventDefault();
    let pass = $('#password').val();
    if ($(this).val() === '') {
    } else {
    }

    // validate if the password is the same as the password2
    if (pass === $(this).val()) {
      $('input[type="password"]').addClass('is-success') && $('input[type="password"]').removeClass('is-danger');
    } else {
      $('input[type="password"]').addClass('is-danger') && $('input[type="password"]').removeClass('is-success');
    }
  });
  // end of event listener for password validation
};

// function sign_out() {
//   $.removeCookie('mytoken', { path: '/' });
//   alert('Logged out!');
//   window.location.href = '/login';
// }

// login and register functions
// $('#username').;

function is_username(asValue) {
  let regExp = /^(?=.*[a-zA-Z])[-a-zA-Z0-9_.]{2,10}$/;
  return regExp.test(asValue);
}

function is_password(asValue) {
  let regExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z!@#$%^&*]{8,20}$/;
  return regExp.test(asValue);
}

const is_username_empty = (username) => {
  if (username === '') $('.username-empty').removeClass('is-hidden');
};

const clearAllForm = () => {
  event.preventDefault();
  $('#username').val('');
  $('#password').val('');
  $('#re-enter-password').val('');
};
