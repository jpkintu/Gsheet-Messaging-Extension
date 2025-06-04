# SMS App for Google Sheets

A Google Apps Script application that integrates with Africa's Talking API to send bulk SMS messages directly from Google Sheets.

## Features

- 📱 Send personalized SMS messages to contacts in your spreadsheet
- 🔐 PIN-protected access to the application
- 📊 Track delivery status and costs directly in your sheet
- ⚙️ Simple configuration of data columns
- ✅ Test credentials functionality
- 🔄 Automatic phone number formatting for Uganda (+256)

## Prerequisites

- Google account
- Google Sheets document
- Africa's Talking API credentials (username and API key)
- Administrative PIN (set in the credebtials.gs file)

## Installation

1. **Open your Google Sheet**
2. Go to `Extensions > Apps Script`
3. Delete any existing code and create these files:
   - `code.gs` (main application logic)
   - `credentials.gs` (stores API credentials - keep this private)
   - `Sidebar.html` (user interface)
4. Copy the contents from each respective file in this repository
5. Save the project

## Configuration

1. Set up your credentials in `credentials.gs`:
   ```javascript
   function getCredentials() {
     return {
       API_KEY: 'your_api_key_here',
       USERNAME: 'your_username_here',
       DEFAULT_PIN: 'your_pin_here',
   
   //Test and Help Details
       TEST_NUMBER:'admin phone number',
       NAME:'admin name',
       EMAIL:'admin email'
   
     };
   }
 2. Spreadsheet Organization

Organize your spreadsheet with these columns (adjust in settings as needed):

- **Phone numbers** - Column containing recipient phone numbers
- **Messages** - Column containing personalized message content
- **Status** - Will be auto-filled by the app with delivery information

## Usage

1. Open your Google Sheet
2. Go to `Extensions > Distribution SMS App > Open SMS Sender`
3. Enter your PIN when prompted
4. In the sidebar:
   - Configure your column settings (phone, message, status columns)
   - Set the starting row (to skip headers)
   - Click "Save Settings"
5. To send messages:
   - Ensure your phone numbers and messages are properly formatted
   - Click "Send Messages"
6. View delivery status in your status column

## Security Notes

- 🔒 Never share your `credentials.gs` file
- 🔑 Change the default PIN after first use
- 📛 The PIN is stored in plaintext in the script (consider additional security for sensitive deployments)

## Troubleshooting

### Common Issues

**Messages not sending:**
- Verify your Africa's Talking account has sufficient credit
- Check your API credentials are correct
- Ensure phone numbers are properly formatted

**Sidebar not loading:**
- Refresh your spreadsheet
- Ensure all script files are properly saved  
