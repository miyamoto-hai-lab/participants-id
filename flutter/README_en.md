# Flutter browser-id

[日本語](README.md) | **English**

Library for Flutter.

## Installation
Add the following to `pubspec.yaml`.
```yaml
dependencies:
  browser_id:
    git:
      url: https://github.com/miyamoto-hai-lab/browser-id.git
      path: flutter
```
After addition, run:
```shell
flutter pub get
```

## Usage
```dart
import 'package:flutter/material.dart';
import 'package:browser_id/browser_id.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Center(
          child: FutureBuilder<String?>(
            future: _getBrowserId(),
            builder: (context, snapshot) {
              if (snapshot.hasData) {
                return Text('Browser ID: ${snapshot.data}');
              } else {
                return const CircularProgressIndicator();
              }
            },
          ),
        ),
      ),
    );
  }

  Future<String?> _getBrowserId() async {
    try {
      final browser = Browser(appName: "my_experiment_app");
      return await browser.id;
    } catch (e) {
      debugPrint('Error getting browser ID: $e');
      return null;
    }
  }
}
```
First, create an instance of the BrowserID class.
Pass the experiment application name as an argument.

The experiment application name is used when [saving attributes](#saving-and-retrieving-other-information-related-to-subjects).
It is recommended to include your nickname to distinguish it from other lab members' experiment applications.

### Get Browser-Unique ID for Identifying Subjects
Use the `id` property to get the UUID generated for each browser.
```dart
try {
  final browserId = await browser.id;
} catch (e) {
  // Error handling
}
```
Executing the above retrieves the UUID stored in each browser's local storage (SharedPreferences).
If the subject accesses the experiment page for the first time and there is no ID in local storage yet, a new UUID is generated, saved, and returned.
An exception is thrown if saving or retrieving fails.

### Saving and Retrieving Other Information Related to Subjects
In this library, you can save and retrieve not only the browser ID but also other information such as the subject's crowdsourcing ID, age, gender, etc.
```dart
try {
  await browser.setAttribute("crowdworker_id", "1234567890");
  final crowdworkerId = await browser.getAttribute("crowdworker_id");
} catch (e) {
  // Error handling
}
```
Executing the above saves/retrieves the crowdworker ID to/from local storage.

For example, when conducting an experiment on [Crowdworks](https://crowdworks.jp/), by asking each subject for their Crowdworks ID and saving it as an attribute, you can identify the same subject if they try to participate in the experiment multiple times using different browsers.
