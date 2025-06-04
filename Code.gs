// code.gs
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Distribution SMS App")
    .addItem('Open SMS Sender', 'promptForPin')
    .addToUi();
}

function promptForPin() {
  var credentials = getCredentials();
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('Enter PIN', 'Please enter the PIN to access the SMS Sender:', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() == ui.Button.OK) {
    var enteredPin = response.getResponseText();
    if (enteredPin === credentials.DEFAULT_PIN) {
      openSidebar();
    } else {
      ui.alert('Incorrect PIN', 'The PIN you entered is incorrect. Please try again.', ui.ButtonSet.OK);
    }
  }
}

function openSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle("Distribution Team SMS Sender")
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getColumnLetter(columnIndex) {
  var temp, letter = '';
  while (columnIndex > 0) {
    temp = (columnIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    columnIndex = (columnIndex - temp - 1) / 26;
  }
  return letter;
}

function saveSettings(settings) {
  PropertiesService.getScriptProperties().setProperties(settings);
  return 'Settings saved successfully!';
}

function getSettings() {
  return PropertiesService.getScriptProperties().getProperties();
}

function formatPhoneNumber(phoneNumber) {
  phoneNumber = String(phoneNumber);
  phoneNumber = phoneNumber.replace(/\D/g, '');

  if (phoneNumber.startsWith('256')) {
    return '+' + phoneNumber;
  } else if (phoneNumber.startsWith('0')) {
    return '+256' + phoneNumber.slice(1);
  } else {
    return '+256' + phoneNumber;
  }
}

function sendMessages() {
  var credentials = getCredentials();
  var properties = PropertiesService.getScriptProperties().getProperties();
  var phoneColumn = properties.phoneColumn;
  var messageColumn = properties.messageColumn;
  var statusColumn = properties.statusColumn;
  var startingRow = parseInt(properties.startingRow);

  if (!phoneColumn || !messageColumn || !statusColumn || !startingRow) {
    return 'Error: Please select all columns and the starting row before sending messages.';
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var phoneRange = sheet.getRange(phoneColumn + startingRow + ':' + phoneColumn + lastRow);
  var messageRange = sheet.getRange(messageColumn + startingRow + ':' + messageColumn + lastRow);
  var statusRange = sheet.getRange(statusColumn + startingRow + ':' + statusColumn + lastRow);

  var phoneNumbers = phoneRange.getValues();
  var messages = messageRange.getValues();
  var statuses = [];

  for (var i = 0; i < phoneNumbers.length; i++) {
    var phoneNumber = phoneNumbers[i][0];
    var message = messages[i][0];

    if (phoneNumber && message) {
      try {
        Logger.log('Raw phone number: ' + phoneNumber);
        var formattedPhoneNumber = formatPhoneNumber(phoneNumber);

        var url = 'https://api.africastalking.com/version1/messaging';

        var payload = {
          'username': credentials.USERNAME,
          'to': formattedPhoneNumber,
          'message': message
        };

        var options = {
          'method': 'post',
          'payload': payload,
          'headers': {
            'apiKey': credentials.API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          'muteHttpExceptions': true
        };

        var response = UrlFetchApp.fetch(url, options);
        var responseCode = response.getResponseCode();
        var responseText = response.getContentText();
        
        Logger.log('Response Code: ' + responseCode);
        Logger.log('Response Text: ' + responseText);

        var responseBody;
        try {
          responseBody = JSON.parse(responseText);
        } catch (jsonError) {
          Logger.log('Error parsing JSON: ' + jsonError);
          responseBody = { error: true, message: 'Invalid JSON response' };
        }

        if (responseCode === 200 || responseCode === 201) {
          if (responseBody && responseBody.SMSMessageData && responseBody.SMSMessageData.Recipients && responseBody.SMSMessageData.Recipients.length > 0) {
            var recipient = responseBody.SMSMessageData.Recipients[0];
            var status = recipient.status;
            var messageId = recipient.messageId;
            var cost = recipient.cost;
            
            Logger.log('Message sent to ' + formattedPhoneNumber + '. Status: ' + status + ', MessageId: ' + messageId + ', Cost: ' + cost);
            statuses.push([status + ' (ID: ' + messageId + ', Cost: ' + cost + ')']);
          } else {
            throw new Error('Unexpected response structure');
          }
        } else {
          throw new Error('HTTP Error ' + responseCode + ': ' + (responseBody.message || responseText));
        }
      } catch (error) {
        Logger.log('Error sending message to ' + phoneNumber + ': ' + error);
        statuses.push(['Error: ' + error.message]);
      }
    } else {
      statuses.push(['']);
    }
  }

  statusRange.setValues(statuses);
  return 'Messages sent and statuses updated successfully!';
}

function getHelpInfo() {
  var credentials = getCredentials();
  return {
    name: credentials.NAME,
    email: credentials.EMAIL,
    phone: credentials.TEST_NUMBER
  };
}

function logFullResponse(response) {
  Logger.log('Full Response:');
  Logger.log('Response Code: ' + response.getResponseCode());
  Logger.log('Response Headers: ' + JSON.stringify(response.getAllHeaders()));
  Logger.log('Response Content: ' + response.getContentText());
}

function testAfricasTalkingCredentials() {
  var credentials = getCredentials();
  var url = 'https://api.africastalking.com/version1/messaging';
  var options = {
    'method': 'post',
    'payload': {
      'username': credentials.USERNAME,
      'to': credentials.TEST_NUMBER, // Use a valid test number
      'message': 'This is a test message'
    },
    'headers': {
      'apiKey': credentials.API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    'muteHttpExceptions': true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    logFullResponse(response);
    var responseCode = response.getResponseCode();
    var responseBody = JSON.parse(response.getContentText());

    if (responseCode === 200 || responseCode === 201) {
      if (responseBody && responseBody.SMSMessageData && responseBody.SMSMessageData.Recipients && responseBody.SMSMessageData.Recipients.length > 0) {
        var recipient = responseBody.SMSMessageData.Recipients[0];
        var status = recipient.status;
        return "Africa's Talking credentials are valid. Test message status: " + status;
      } else {
        return "Africa's Talking credentials seem valid, but the response structure was unexpected.";
      }
    } else {
      return 'Authentication failed. Please check your Africa\'s Talking credentials. Response Code: ' + responseCode + ', Message: ' + (responseBody.message || 'Unknown error');
    }
  } catch (error) {
    Logger.log('Error testing Africa\'s Talking credentials: ' + error);
    return 'Error testing Africa\'s Talking credentials: ' + error.message;
  }
}