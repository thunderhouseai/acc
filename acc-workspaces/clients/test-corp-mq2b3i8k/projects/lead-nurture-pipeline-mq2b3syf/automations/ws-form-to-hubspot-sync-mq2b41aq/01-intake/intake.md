## Goal
Automatically create a HubSpot contact and send a welcome email via Gmail when a website contact form is submitted.

## Trigger
A user submits the contact form on the Test Corp website.

## Actions
1. Create a new contact in HubSpot using data from the submitted contact form.
2. Send a welcome email via Gmail to the new contact created in HubSpot.

## Systems involved
- Test Corp Website (for the contact form)
- HubSpot
- Gmail

## Missing information
1. Details about the website contact form technology (e.g., WordPress, custom HTML, specific form builder) and how to capture submission data.
2. Specific data fields collected by the website contact form (e.g., name, email, company, message).
3. Which specific HubSpot properties should be populated with data from the contact form submission.
4. The exact content (subject and body) of the welcome email to be sent via Gmail.
5. The Gmail sender email address.

## Risk level
High - This automation sends external messages via Gmail and handles personal contact data by creating records in HubSpot.

## Recommended next stage
Requirements