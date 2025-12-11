import 'package:flutter_test/flutter_test.dart';
import 'package:participants_id/participants_id.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Participant', () {
    const String appName = 'test_app';
    const String prefix = 'participants_id';

    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('browserId generates new ID if not exists', () async {
      final participant = Participant(appName: appName);
      final id = await participant.browserId;
      expect(id, isNotEmpty);
      
      // Check created_at
      final createdAt = await participant.createdAt;
      expect(createdAt, isNotEmpty);
      expect(createdAt.endsWith('Z'), isTrue);
      
      // updated_at should be empty initially
      final updatedAt = await participant.updatedAt;
      expect(updatedAt, isEmpty);
    });

    test('browserId persists across instances', () async {
      final participant1 = Participant(appName: appName);
      final id1 = await participant1.browserId;

      final participant2 = Participant(appName: appName);
      final id2 = await participant2.browserId;

      expect(id1, equals(id2));
    });

    test('deleteBrowserId removes the ID and timestamps', () async {
      final participant = Participant(appName: appName);
      final id = await participant.browserId;
      expect(id, isNotEmpty);

      await participant.deleteBrowserId();

      // Accessing browserId again should generate a NEW one
      final newId = await participant.browserId;
      expect(newId, isNot(equals(id)));
      
      // Timestamps should be reset/recreated
      final createdAt = await participant.createdAt;
      expect(createdAt, isNotEmpty);
    });

    test('setAttribute and getAttribute work for String', () async {
      final participant = Participant(appName: appName);
      await participant.setAttribute('test_string', 'hello');
      final value = await participant.getAttribute('test_string');
      expect(value, equals('hello'));
      
      expect(await participant.attributesExists('test_string'), isTrue);
    });

    test('setAttribute and getAttribute work for int', () async {
      final participant = Participant(appName: appName);
      await participant.setAttribute('test_int', 123);
      final value = await participant.getAttribute('test_int');
      expect(value, equals(123));
    });

    test('setAttribute and getAttribute work for bool', () async {
      final participant = Participant(appName: appName);
      await participant.setAttribute('test_bool', true);
      final value = await participant.getAttribute('test_bool');
      expect(value, equals(true));
    });

    test('setAttribute and getAttribute work for List<String>', () async {
      final participant = Participant(appName: appName);
      await participant.setAttribute('test_list', ['a', 'b']);
      final value = await participant.getAttribute('test_list');
      expect(value, equals(['a', 'b']));
    });

    test('deleteAttribute removes the attribute', () async {
      final participant = Participant(appName: appName);
      await participant.setAttribute('test_delete', 'value');
      expect(await participant.getAttribute('test_delete'), equals('value'));

      await participant.deleteAttribute('test_delete');
      expect(await participant.getAttribute('test_delete'), isNull);
      expect(await participant.attributesExists('test_delete'), isFalse);
    });

    test('getAttribute returns default value if not found', () async {
      final participant = Participant(appName: appName);
      final value = await participant.getAttribute('non_existent', 'default');
      expect(value, equals('default'));
    });
    
    test('Data isolation between appNames (attributes)', () async {
      final participant1 = Participant(appName: 'app1');
      final participant2 = Participant(appName: 'app2');
      
      await participant1.setAttribute('key', 'value1');
      await participant2.setAttribute('key', 'value2');
      
      expect(await participant1.getAttribute('key'), equals('value1'));
      expect(await participant2.getAttribute('key'), equals('value2'));
    });

    test('Validation function works', () async {
      int callCount = 0;
      Future<bool> validationFunc(String id) async {
        callCount++;
        return callCount > 2; // Fail first 2 times
      }

      final participant = Participant(
        appName: appName,
        browserIdValidationFunc: validationFunc,
      );

      final id = await participant.browserId;
      expect(id, isNotEmpty);
      expect(callCount, equals(3));
    });

    test('Validation failure throws exception after retries', () async {
      Future<bool> validationFunc(String id) async {
        return false; // Always fail
      }

      final participant = Participant(
        appName: appName,
        browserIdValidationFunc: validationFunc,
      );

      expect(() async => await participant.browserId, throwsException);
    });
    
    test('getBrowserId with generateIfNotExists=false', () async {
      final participant = Participant(appName: appName);
      // Ensure clean state
      await participant.deleteBrowserId();
      
      final id = await participant.getBrowserId(generateIfNotExists: false);
      expect(id, isEmpty);
      
      final id2 = await participant.getBrowserId(generateIfNotExists: true);
      expect(id2, isNotEmpty);
    });
    
    test('browserIdExists works', () async {
      final participant = Participant(appName: appName);
      await participant.deleteBrowserId();
      expect(await participant.browserIdExists(), isFalse);
      
      await participant.browserId;
      expect(await participant.browserIdExists(), isTrue);
    });
  });
}
