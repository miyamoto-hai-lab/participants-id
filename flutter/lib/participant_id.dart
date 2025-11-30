import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

/// Fletクライアントストレージを使用してUUIDv7を保存・取得・管理するライブラリです。
class Participant {
  final String appName;
  final String prefix;
  final Uuid _uuid = const Uuid();

  /// [appName] 実験アプリケーションの名前(attributesの保存に使用されます)
  /// [prefix] 他のアプリと区別するためのストレージキーのプレフィックス (通常は指定する必要はありません。)
  Participant({required this.appName, this.prefix = "participant_id"});

  /// UUIDv7を(再)生成してbrowser_idに保存します。
  ///
  /// [注意!] browser_idを再生成すると他の実験プロジェクトに影響を及ぼす可能性があります。
  /// 再生成は他のプロジェクト関係者に確認を取ってから慎重に行うことをお勧めします。
  ///
  /// Returns: 新しく生成されたブラウザID。
  /// Throws: [Exception] 保存に失敗した場合。
  Future<String> _generateBrowserId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // uuid v4.x supports v7 directly
      final newId = _uuid.v7();
      
      final success = await prefs.setString('$prefix.browser_id', newId);
      if (!success) {
        throw Exception('Failed to save browser_id to SharedPreferences');
      }
      return newId;
    } catch (e) {
      throw Exception('Failed to generate or save browser_id: $e');
    }
  }

  /// ブラウザIDを取得します。
  ///
  /// ブラウザIDがまだ存在しない場合は、新たに生成します。
  ///
  /// Returns: 保存されていたブラウザID、または生成された新しいブラウザID。
  /// Throws: [Exception] 取得または生成に失敗した場合。
  Future<String> get browserId async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final id = prefs.getString('$prefix.browser_id');
      if (id != null) {
        return id;
      } else {
        return await _generateBrowserId();
      }
    } catch (e) {
      throw Exception('Failed to get browser_id: $e');
    }
  }

  /// ブラウザIDをストレージから削除します。
  ///
  /// Throws: [Exception] 削除に失敗した場合。
  Future<void> deleteBrowserId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final success = await prefs.remove('$prefix.browser_id');
      if (!success) {
         // Note: remove returns true if the key was removed or didn't exist.
         // It returns false only on failure (e.g. disk error).
         throw Exception('Failed to remove browser_id from SharedPreferences');
      }
    } catch (e) {
      throw Exception('Failed to delete browser_id: $e');
    }
  }

  /// 指定されたフィールドに値を保存します。
  ///
  /// 参加者のクラウドソーシングIDや属性を保存するのに使用できます。
  ///
  /// [field] フィールド名
  /// [value] 保存する値 (int, double, bool, String, List<String>, null)
  ///
  /// Throws: [Exception] 保存に失敗した場合。
  Future<void> setAttribute(String field, dynamic value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$prefix.$appName.$field';
      
      bool success;
      if (value == null) {
        success = await prefs.remove(key);
      } else if (value is String) {
        success = await prefs.setString(key, value);
      } else if (value is int) {
        success = await prefs.setInt(key, value);
      } else if (value is double) {
        success = await prefs.setDouble(key, value);
      } else if (value is bool) {
        success = await prefs.setBool(key, value);
      } else if (value is List<String>) {
        success = await prefs.setStringList(key, value);
      } else {
        // For other types, try to JSON encode
        try {
          success = await prefs.setString(key, jsonEncode(value));
        } catch (e) {
           throw Exception('Failed to encode value for key $key: $e');
        }
      }
      
      if (!success) {
        throw Exception('Failed to save attribute $field to SharedPreferences');
      }
    } catch (e) {
      throw Exception('Failed to set attribute $field: $e');
    }
  }

  /// 指定されたフィールドから値を取得します。
  ///
  /// [field] フィールド名
  /// [defaultValue] デフォルト値
  ///
  /// Returns: 保存されていた属性値、またはデフォルト値
  /// Throws: [Exception] 取得に失敗した場合。
  Future<dynamic> getAttribute(String field, [dynamic defaultValue]) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$prefix.$appName.$field';
      
      // We don't know the type, so we have to check existence and try to retrieve
      if (!prefs.containsKey(key)) {
        return defaultValue;
      }

      // SharedPreferences doesn't have a generic get(), so we try to get what we can
      final value = prefs.get(key);
      return value ?? defaultValue;
    } catch (e) {
      throw Exception('Failed to get attribute $field: $e');
    }
  }

  /// 指定されたフィールドの値をストレージから削除します。
  ///
  /// [field] 削除するフィールド名
  ///
  /// Throws: [Exception] 削除に失敗した場合。
  Future<void> deleteAttribute(String field) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final success = await prefs.remove('$prefix.$appName.$field');
      if (!success) {
        throw Exception('Failed to remove attribute $field from SharedPreferences');
      }
    } catch (e) {
      throw Exception('Failed to delete attribute $field: $e');
    }
  }
}