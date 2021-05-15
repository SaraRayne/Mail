document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#to-archive').addEventListener('click', archive_email);
  document.querySelector('#to-unarchive').addEventListener('click', unarchive_email);
  document.querySelector('#reply').addEventListener('click', reply);


  // By default, load the inbox
  load_mailbox('inbox');

  // When email composition form submitted, send email
  document.querySelector('form').onsubmit = function () {
      let recipients = document.querySelector('#compose-recipients').value;
      let subject = document.querySelector('#compose-subject').value;
      let body = document.querySelector('#compose-body').value;

      fetch('/emails', {
          method: 'POST',
          body: JSON.stringify({
              recipients: recipients,
              subject: subject,
              body: body
          })
      })
      .then(response => response.json())
      .then(result => {
          console.log(result);
          load_mailbox('sent');
      })
      .catch(error => alert(error.message));
      return false;
  }

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#to-archive').style.display = 'none';
  document.querySelector('#to-unarchive').style.display = 'none';
  document.querySelector('#reply').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  console.log('Running mailbox')
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';
  document.querySelector('#to-archive').style.display = 'none';
  document.querySelector('#to-unarchive').style.display = 'none';
  document.querySelector('#reply').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Query API for emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      console.log(emails)
      var i;
      for (i = 0; i < emails.length; i++) {
          // Retrieve values for email
          let sender = emails[i].sender
          let subject = emails[i].subject
          let timestamp = emails[i].timestamp
          let id = emails[i].id
          // Create new div block for email data
          const div = document.createElement('div');
          div.className = "email-div";

          // Add email data to new div
          div.innerHTML += ` ${sender} &nbsp &nbsp ${subject} &nbsp &nbsp Date: ${timestamp}`;

          // When email is clicked, go to load_email function
          div.addEventListener('click', function () {
              console.log('Element' + id + 'has been clicked, opening email');
              load_email(id, mailbox);
          });

          // Add contents of new div to existing page div
          document.querySelector('#emails-view').append(div);

          // Change background to gray if email is marked as read
          if (emails[i].read === true) {
              div.style.backgroundColor = "gainsboro";
          }

      }

  })
  .catch(error => alert(error.message));

}

function load_email(email_id, mailbox) {
    // Hide email view and display email reader view
    document.querySelector('#read-view').style.display = 'block';
    document.querySelector('#reply').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';

    // Set read view element name to email id, so it can be used for archive functions
    document.querySelector('#read-view').setAttribute("name", email_id);

    // Fetch data for email
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
        // Get email info
        let sender = email.sender;
        let recipients = email.recipients;
        let subject = email.subject;
        let body = email.body;
        let timestamp = email.timestamp;
        let read = email.read;

        // If email unread, mark as read in database
        if (read === false) {
            fetch(`/emails/${email_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    read: true
                })
            })
        }

        // Get email reader div and add email info to innerHTML
        const page_display = document.querySelector('#read-view');
        page_display.innerHTML = `<h3>Subject: ${subject}</h3> <br> <h5>From: <em>${sender}</em> <br> To: <em>${recipients}</em></h5> <br> ${body } <br> Date: ${timestamp}`;
    })
    .catch(error => alert(error.message));

    if (mailbox === 'inbox') {
        document.querySelector('#to-archive').style.display = 'block';
        document.querySelector('#to-unarchive').style.display = 'none';
    }

    if (mailbox === 'archive') {
        document.querySelector('#to-archive').style.display = 'none';
        document.querySelector('#to-unarchive').style.display = 'block';
    }

}

function archive_email() {
    // Get email ID from element name
    let email_id = document.querySelector('#read-view').getAttribute('name');

    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
    })
    .then(result => {
        load_mailbox('inbox');
    })
    .catch(error => alert(error.message));
}

function unarchive_email() {
    // Get email ID from element name
    let email_id = document.querySelector('#read-view').getAttribute('name');

    fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
    })
    .then(result => {
        load_mailbox('inbox');
    })
    .catch(error => alert(error.message));
}

function reply() {
    // Show compose view and hide others
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#read-view').style.display = 'none';
    document.querySelector('#to-archive').style.display = 'none';
    document.querySelector('#to-unarchive').style.display = 'none';
    document.querySelector('#reply').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Get values for reply email through fetch
    let email_id = document.querySelector('#read-view').getAttribute('name');

    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
        // Set values from fetch
        let recipient = email.sender;
        let subject = email.subject;
        let body = email.body;
        let timestamp = email.timestamp;

        // Set composition fields
        document.querySelector('#compose-recipients').value = `${recipient}`;
        // if subject begins with 'Re:', value is just subject, else start with 'Re:' then subject
        if (subject.startsWith('Re:')) {
            document.querySelector('#compose-subject').value = `${subject}`;
        } else {
            document.querySelector('#compose-subject').value = `Re: ${subject}`;
        }

        document.querySelector('#compose-body').value = `On ${timestamp} ${recipient} wrote: ${body}`;
    })
    .catch(error => alert(error.message));
}
