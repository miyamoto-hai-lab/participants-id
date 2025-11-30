from typing import Any, List, Optional, Union

import flet as ft

try:
    # For Python 3.14+
    from uuid import uuid7
except ImportError:
    # For Python < 3.14
    try:
        from uuid_extensions import uuid7
    except ImportError as e:
        e.add_note("pip install uuid7 を実行してパッケージをインストールしてください。")
        raise e

class Participant:
    """
    Fletクライアントストレージを使用してUUIDv7を保存・取得・管理するライブラリです。
    """
    def __init__(self, page: ft.Page, app_name: str, prefix: str = "participant_id"):
        """
        :param page: 現在のFletアプリケーションのft.Pageオブジェクト
        :type page: flet.Page   
        :param app_name: 実験アプリケーションの名前(attributesの保存に使用されます)
        :type app_name: str
        :param prefix: 他のアプリと区別するためのストレージキーのプレフィックス
            (通常は指定する必要はありません。)
        :type prefix: str
        """
        self.storage = page.client_storage
        self.app_name = app_name
        self.prefix = prefix
    
    async def _generate_browser_id(self) -> Optional[str]:
        """UUIDv7を(再)生成してbrowser_idに保存します。

        [注意!] browser_idを再生成すると他の実験プロジェクトに影響を及ぼす可能性があります。
        再生成は他のプロジェクト関係者に確認を取ってから慎重に行うことをお勧めします。
        
        :return: 新しく生成されたブラウザID。保存に失敗した場合はNone。
        :rtype: str | None
        """
        new_id = str(uuid7())
        is_successful = await self.storage.set(f"{self.prefix}.browser_id", new_id)
        if is_successful:
            return new_id
        else:
            return None
    
    @property
    async def browser_id(self) -> Optional[str]:
        """ブラウザIDを取得します。

        ブラウザIDがまだ存在しない場合は、新たに生成します。

        :return: 保存されていたブラウザID、または生成された新しいブラウザID。生成に失敗した場合はNone。
        :rtype: str | None
        """
        id = await self.storage.get(f"{self.prefix}.browser_id")
        if id:
            return id
        else:
            return await self._generate_browser_id()
    
    async def delete_browser_id(self) -> bool:
        """ブラウザIDをストレージから削除します。
        
        :return: 削除に成功した場合はTrue、それ以外はFalse
        :rtype: bool
        """
        return await self.storage.remove(f"{self.prefix}.browser_id")
    
    async def set_attribute(self, field: str, value: Union[int, float, bool, str, List[str], None]) -> bool:
        """指定されたフィールドに値を保存します。

        参加者のクラウドソーシングIDや属性を保存するのに使用できます。
        
        :param field: フィールド名
        :type field: str
        :param value: 保存する値
        :type value: int | float | bool | str | list[str] | None
        
        :return: 保存に成功した場合はTrue、それ以外はFalse
        :rtype: bool
        """
        return await self.storage.set(f"{self.prefix}.{self.app_name}.{field}", value)
    
    async def get_attribute(self, field: str, default: Any = None) -> Union[int, float, bool, str, List[str], None, Any]:
        """指定されたフィールドから値を取得します。
        
        :param field: フィールド名
        :type field: str
        :param default: デフォルト値
        :type default: Any
        
        :return: 保存されていた属性値、またはデフォルト値
        :rtype: Any
        """
        value = await self.storage.get(f"{self.prefix}.{self.app_name}.{field}")
        if value:
            return value
        else:
            return default

    async def delete_attribute(self, field: str) -> bool:
        """指定されたフィールドの値をストレージから削除します。
        
        :param field: 削除するフィールド名
        :type field: str
        
        :return: 削除に成功した場合はTrue、それ以外はFalse
        :rtype: bool
        """
        return await self.storage.remove(f"{self.prefix}.{self.app_name}.{field}")
