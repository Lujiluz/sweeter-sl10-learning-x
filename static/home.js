// close dropdowns if clicking outside

// navbar burger functionality
$(document).ready(function () {
  $('.navbar-burger').click(function () {
    $('.navbar-burger').toggleClass('is-active');
    $('.navbar-menu').toggleClass('is-active');

    if ($('.navbar-menu').hasClass('is-active')) {
      $('#profile-link').hide();
    } else {
      $('#profile-link').show();
    }
  });

  // menampilkan postingan yang telah dibuat
  $.ajax({
    type: 'GET',
    url: '/get_posts',
    data: {},
    success: function (res) {
      res.posts.map((post) => {
        console.log(post);
        let heartIconClass = post.liked_by_me ? 'fa-heart' : 'fa-heart-o';
        let starIconClass = post.starred_by_me ? 'fa-star' : 'fa-star-o';
        let thumbsIconClass = post.thumbed_by_me ? 'fa-thumbs-up' : 'fa-thumbs-o-up';
        let date_post = moment(post.date_post);
        let relative_time = date_post.fromNow();
        let tempHtml = `<div id="post-box" class="p-3 mt-3">
          <article class="media mb-5" id="${post._id}">
            <div class="media-left">
              <a class="image is-64x64" href="#"> <img class="is-rounded" src="static/${post.username.profile_pict == '' ? post.username.default_profile_pict : post.username.profile_pict}" alt="Image" /> </a>
            </div>
            <div class="media-content">
              <div class="content">
                <p>
                  <strong>${post.username.profile_name}</strong> <small>@${post.username.username}</small>
                  <small>${relative_time}</small>
                  <br />
                  ${post.sweets}
                </p>
              </div>
              <nav class="level is-mobile">
                <div class="level-left">
                  <a class="level-item is-sparta" aria-label="heart" onclick="handleToggleReaction('${post._id}', 'heart')">
                    <span class="icon is-small"><i class="fa ${heartIconClass} has-text-danger" aria-hidden="true"></i></span>&nbsp;<span class="like-num has-text-danger">${formatLikes(post.likes)}</span>
                  </a>
                  <a class="level-item is-sparta" aria-label="star" onclick="handleToggleReaction('${post._id}', 'star')">
                    <span class="icon is-small"><i class="fa ${starIconClass} has-text-warning" aria-hidden="true"></i></span>&nbsp;<span class="like-num has-text-warning">${formatLikes(post.stars)}</span>
                  </a>
                  <a class="level-item is-sparta" aria-label="thumb" onclick="handleToggleThumbs('${post._id}', 'thumb')">
                    <span class="icon is-small"><i class="fa ${thumbsIconClass} has-text-info" aria-hidden="true"></i></span>&nbsp;<span class="like-num has-text-info">${formatLikes(post.thumbs)}</span>
                  </a>
                </div>
              </nav>
            </div>
          </article>
        </div>`;

        $('#posts').prepend(tempHtml);
      });
    },
  });
});

// handle post sweets
const handlePost = () => {
  let sweets = $('#sweets').val();
  let date_post = new Date().toISOString();

  $.ajax({
    type: 'POST',
    url: '/posting',
    data: {
      sweets,
      date_post,
    },
    success: function (res) {
      alert(res.msg);
      $('#sweets').val('');
      window.location.reload();
    },
  });
};

// handle toggle like and star
const handleToggleReaction = (postId, reactionType) => {
  let aTag = $(`#${postId} a[aria-label='${reactionType}']`);
  let icon = aTag.find('i');

  let isLike = icon.hasClass(`fa-${reactionType}-o`);

  $.ajax({
    type: 'POST',
    url: '/update_likes',
    contentType: 'application/json',
    data: JSON.stringify({
      postId,
      reactionType,
      isLike,
    }),
    success: function (res) {
      let newClass = isLike ? `fa-${reactionType}` : `fa-${reactionType}-o`;
      icon.removeClass().addClass(`fa ${newClass} has-text-${reactionType === 'heart' ? 'danger' : reactionType === 'star' ? 'warning' : 'info'}`);
      aTag.find('span.like-num').text(formatLikes(res.likes_count));
    },
  });
};

// handle toggle thumbs up
const handleToggleThumbs = (postId, reactionType) => {
  let aTag = $(`#${postId} a[aria-label='thumb']`);
  let icon = aTag.find('i');

  if (icon.hasClass('fa-thumbs-o-up')) {
    $.ajax({
      type: 'POST',
      url: '/update_likes',
      contentType: 'application/json',
      data: JSON.stringify({
        postId,
        reactionType,
        isLike: true,
      }),
      success: function (res) {
        icon.removeClass('fa-thumbs-o-up').addClass('fa-thumbs-up');
        aTag.find('span.like-num').text(formatLikes(res.likes_count));
      },
    });
  } else {
    $.ajax({
      type: 'POST',
      url: '/update_likes',
      contentType: 'application/json',
      data: JSON.stringify({
        postId,
        reactionType,
        isLike: false,
      }),
      success: function (res) {
        icon.removeClass('fa-thumbs-up').addClass('fa-thumbs-o-up');
        aTag.find('span.like-num').text(formatLikes(res.likes_count));
      },
    });
  }
};
// formatting the likes counter
const formatLikes = (likes) => {
  if (likes >= 1000) {
    return (likes / 1000).toFixed(likes % 1000 !== 0 ? 1 : 0) + 'k';
  }
  return likes.toString();
};

// modal box functionality
document.addEventListener('DOMContentLoaded', () => {
  // Functions to open and close a modal
  function openModal($el) {
    $el.classList.add('is-active');
  }

  function closeModal($el) {
    $el.classList.remove('is-active');
  }

  function closeAllModals() {
    (document.querySelectorAll('.modal') || []).forEach(($modal) => {
      closeModal($modal);
    });
  }

  // Add a click event on buttons to open a specific modal
  (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
    const modal = $trigger.dataset.target;
    const $target = document.getElementById(modal);

    $trigger.addEventListener('click', () => {
      openModal($target);
    });
  });

  // Add a click event on various child elements to close the parent modal
  (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
    const $target = $close.closest('.modal');

    $close.addEventListener('click', () => {
      closeModal($target);
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllModals();
    }
  });

  // update profile functionality
  const profilePicture = document.getElementById('profile-picture');
  const fileInput = document.getElementById('file-input');

  profilePicture.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        profilePicture.querySelector('img').src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
});

const handleSaveChanges = () => {
  const formData = new FormData();
  let profile_img = $('#file-input')[0].files[0];
  if (profile_img) formData.append('profile_img', profile_img);

  formData.append('username', $('#username').val());
  formData.append('bio', $('#bio').val());

  $.ajax({
    type: 'POST',
    url: '/update_profile',
    data: formData,
    contentType: false,
    processData: false,
    success: function (response) {
      alert(response.msg);
    },
  });
};
