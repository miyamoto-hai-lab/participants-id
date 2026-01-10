import 'package:flutter_test/flutter_test.dart';
import 'package:browser_id/browser_id.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('BrowserID', () {
    const String appName = 'test_app';
    const String prefix = 'browser_id';

    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('browserId generates new ID if not exists', () async {
      final browser = Browser(appName: appName);
      final id = await browser.id;
      expect(id, isNotEmpty);
      
      // Check created_at
      final createdAt = await browser.createdAt;
      expect(createdAt, isNotEmpty);
      expect(createdAt.endsWith('Z'), isTrue);
      
      // updated_at should be empty initially
      final updatedAt = await browser.updatedAt;
      expect(updatedAt, isEmpty);
    });

    test('browserId persists across instances', () async {
      final browser1 = Browser(appName: appName);
      final id1 = await browser1.id;

      final browser2 = Browser(appName: appName);
      final id2 = await browser2.id;

      expect(id1, equals(id2));
    });

    test('deleteBrowserId removes the ID and timestamps', () async {
      final browser = Browser(appName: appName);
      final id = await browser.id;
      expect(id, isNotEmpty);

      await browser.deleteId();

      // Accessing browserId again should generate a NEW one
      final newId = await browser.id;
      expect(newId, isNot(equals(id)));
      
      // Timestamps should be reset/recreated
      final createdAt = await browser.createdAt;
      expect(createdAt, isNotEmpty);
    });

    test('setAttribute and getAttribute work for String', () async {
      final browser = Browser(appName: appName);
      await browser.setAttribute('test_string', 'hello');
      final value = await browser.getAttribute('test_string');
      expect(value, equals('hello'));
      
      expect(await browser.attributesExists('test_string'), isTrue);
    });

    test('setAttribute and getAttribute work for int', () async {
      final browser = Browser(appName: appName);
      await browser.setAttribute('test_int', 123);
      final value = await browser.getAttribute('test_int');
      expect(value, equals(123));
    });

    test('setAttribute and getAttribute work for bool', () async {
      final browser = Browser(appName: appName);
      await browser.setAttribute('test_bool', true);
      final value = await browser.getAttribute('test_bool');
      expect(value, equals(true));
    });

    test('setAttribute and getAttribute work for List<String>', () async {
      final browser = Browser(appName: appName);
      await browser.setAttribute('test_list', ['a', 'b']);
      final value = await browser.getAttribute('test_list');
      expect(value, equals(['a', 'b']));
    });

    test('deleteAttribute removes the attribute', () async {
      final browser = Browser(appName: appName);
      await browser.setAttribute('test_delete', 'value');
      expect(await browser.getAttribute('test_delete'), equals('value'));

      await browser.deleteAttribute('test_delete');
      expect(await browser.getAttribute('test_delete'), isNull);
      expect(await browser.attributesExists('test_delete'), isFalse);
    });

    test('getAttribute returns default value if not found', () async {
      final browser = Browser(appName: appName);
      final value = await browser.getAttribute('non_existent', 'default');
      expect(value, equals('default'));
    });
    
    test('Data isolation between appNames (attributes)', () async {
      final browser1 = Browser(appName: 'app1');
      final browser2 = Browser(appName: 'app2');
      
      await browser1.setAttribute('key', 'value1');
      await browser2.setAttribute('key', 'value2');
      
      expect(await browser1.getAttribute('key'), equals('value1'));
      expect(await browser2.getAttribute('key'), equals('value2'));
    });

    test('Validation function works', () async {
      int callCount = 0;
      Future<bool> validationFunc(String id) async {
        callCount++;
        return callCount > 2; // Fail first 2 times
      }

      final browser = Browser(
        appName: appName,
        idValidationFunc: validationFunc,
      );

      final id = await browser.id;
      expect(id, isNotEmpty);
      expect(callCount, equals(3));
    });

    test('Validation failure throws exception after retries', () async {
      Future<bool> validationFunc(String id) async {
        return false; // Always fail
      }

      final browser = Browser(
        appName: appName,
        idValidationFunc: validationFunc,
      );

      expect(() async => await browser.id, throwsException);
    });
    
    test('getBrowserId', () async {
      final browser = Browser(appName: appName);
      // Ensure clean state
      await browser.deleteId();
      
      final id = await browser.id;
      expect(id, isNotEmpty);
    });
    
    test('browserIdExists works', () async {
      final browser = Browser(appName: appName);
      await browser.deleteId();
      expect(await browser.idExists(), isFalse);
      
      await browser.id;
      expect(await browser.idExists(), isTrue);
    });
  });
}
