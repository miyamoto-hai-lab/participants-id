import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

/// Fletクライアントストレージを使用してUUIDv7を保存・取得・管理するライブラリです。
class Participant {
  static const int MAX_RETRY_VALIDATION = 10; // ブラウザID検証の最大試行回数

  final String appName;
  final String prefix;
  final Future<bool> Function(String)? browserIdValidationFunc;
  final Uuid _uuid = const Uuid();

  /// [appName] 実験アプリケーションの名前(attributesの保存に使用されます)
  /// [prefix] 他のアプリと区別するためのストレージキーのプレフィックス (通常は指定する必要はありません。)
  /// [browserIdValidationFunc] ブラウザIDの検証関数
  /// (ブラウザIDを生成した後に保存前に呼び出されます。
  /// サーバに生成されたIDの登録可否を問い合わせる用途で使用できます。)
  /// (UUIDを受け取り、受理可否をboolで返す非同期関数を指定できます。)
  Participant({
    required this.appName,
    this.prefix = "participants_id",
    this.browserIdValidationFunc,
  });

  /// UUIDv7を(再)生成してbrowser_idに保存します。
  ///
  /// [注意!] browser_idを再生成すると他の実験プロジェクトに影響を及ぼす可能性があります。
  /// 再生成は他のプロジェクト関係者に確認を取ってから慎重に行うことをお勧めします。
  ///
  /// Returns: 新しく生成されたブラウザID。
  /// Throws: [Exception] 保存に失敗した場合、または検証に失敗し続けた場合。
  Future<String> _generateBrowserId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      for (int i = 0; i < MAX_RETRY_VALIDATION; i++) {
        // uuid v4.x supports v7 directly
        final newId = _uuid.v7();
        
        bool isValid = true;
        if (browserIdValidationFunc != null) {
          isValid = await browserIdValidationFunc!(newId);
        }

        if (isValid) {
          final success = await prefs.setString('$prefix.browser_id', newId);
          
          final now = DateTime.now().toUtc().toIso8601String();
          final timestamp = now.endsWith('Z') ? now : '${now}Z';

          if (prefs.containsKey('$prefix.created_at')) {
             await prefs.setString('$prefix.updated_at', timestamp);
          } else {
             await prefs.setString('$prefix.created_at', timestamp);
          }

          if (!success) {
            throw Exception('Failed to save browser_id to SharedPreferences');
          }
          return newId;
        }
      }
      throw Exception('Failed to generate a valid browser_id after $MAX_RETRY_VALIDATION attempts');
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
    final id = await getBrowserId();
    if (id.isEmpty) {
      // This should only happen if generateIfNotExists is false, but here it is true by default.
      // Or if _generateBrowserId failed but didn't throw (which is not the case).
      throw Exception('Failed to get or generate browser_id');
    }
    return id;
  }

  /// ブラウザIDを取得します。
  ///
  /// [generateIfNotExists] Trueの場合、ブラウザIDがまだ存在しない時には新たに生成します。
  ///
  /// Returns: 保存されていたブラウザID、または生成された新しいブラウザID。生成しない設定で存在しない場合は空文字列。
  Future<String> getBrowserId({bool generateIfNotExists = true}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final id = prefs.getString('$prefix.browser_id');
      if (id != null) {
        return id;
      } else {
        if (generateIfNotExists) {
          return await _generateBrowserId();
        } else {
          return "";
        }
      }
    } catch (e) {
      throw Exception('Failed to get browser_id: $e');
    }
  }
  
  /// ブラウザIDの生成日時を取得します。
  ///
  /// Returns: 保存されていたブラウザIDの生成日時。生成日時が保存されていない場合は空文字列。
  Future<String> get createdAt async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('$prefix.created_at') ?? "";
    } catch (e) {
      return "";
    }
  }

  /// ブラウザIDの更新日時を取得します。
  ///
  /// Returns: 保存されていたブラウザIDの更新日時。更新日時が保存されていない場合は空文字列。
  Future<String> get updatedAt async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('$prefix.updated_at') ?? "";
    } catch (e) {
      return "";
    }
  }

  /// ブラウザIDがストレージに存在するかを確認します。
  /// 
  /// Returns: ブラウザIDが存在する場合はTrue、それ以外はFalse
  Future<bool> browserIdExists() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.containsKey('$prefix.browser_id');
    } catch (e) {
      return false;
    }
  }

  /// ブラウザIDをストレージから削除します。
  ///
  /// [注意!] browser_idを削除すると他の実験プロジェクトに影響を及ぼす可能性が高いです。
  /// 削除は特別な事情がない限り行わないでください。
  ///
  /// Throws: [Exception] 削除に失敗した場合。
  Future<void> deleteBrowserId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final success = await prefs.remove('$prefix.browser_id');
      if (success) {
        await prefs.remove('$prefix.created_at');
        await prefs.remove('$prefix.updated_at');
      }
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

  /// 指定されたフィールドがストレージに存在するかを確認します。
  /// 
  /// [field] フィールド名
  /// 
  /// Returns: 属性が存在する場合はTrue、それ以外はFalse
  Future<bool> attributesExists(String field) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.containsKey('$prefix.$appName.$field');
    } catch (e) {
      return false;
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