# Flutter browser-id

**日本語** | [English](README_en.md)

Flutter用のライブラリです。

## インストール
`pubspec.yaml`に以下の内容を追加してください。
```yaml
dependencies:
  browser_id:
    git:
      url: https://github.com/miyamoto-hai-lab/browser-id.git
      path: flutter
```
追加出来たら以下を実行します。
```shell
flutter pub get
```

## 使い方
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
まず最初にBrowserIDクラスのインスタンスを生成します。
実験アプリケーションの名前を引数として渡します。

実験アプリケーションの名前は[attributesの保存](#被験者を識別するためのブラウザ固有のidを取得する)の際に使用されます。
別の研究室メンバーの実験アプリケーションと区別するために、自身のニックネームを含めることを推奨します。

### 被験者を識別するためのブラウザ固有のIDを取得する
各ブラウザで生成されたUUIDを取得するには、`id`プロパティを用います。
```dart
try {
  final browserId = await browser.id;
} catch (e) {
  // エラーハンドリング
}
```
上記を実行すると、各ブラウザのローカルストレージ（SharedPreferences）に保存されたUUIDが取得できます。
被験者が初めて実験ページにアクセスし、まだローカルストレージにIDがない場合には、新たにUUIDを生成して保存し、返します。
保存や取得に失敗した場合は例外がスローされます。

### 被験者に関する他の情報を保存・取得する
このライブラリでは、ブラウザIDだけでなく、被験者のクラウドソーシングIDや年齢、性別など他の情報も保存・取得することができます。
```dart
try {
  await browser.setAttribute("crowdworker_id", "1234567890");
  final crowdworkerId = await browser.getAttribute("crowdworker_id");
} catch (e) {
  // エラーハンドリング
}
```
上記を実行すると、ローカルストレージにクラウドワーカーIDを保存・取得できます。

例えば、[クラウドワークス](https://crowdworks.jp/)上で実験を実施する場合、各被験者のクラウドワークスIDを訊いてattributeとして保存しておくことで、ブラウザを変えて被験者が実験に複数回参加しようとした場合に同一被験者を識別することができます。
