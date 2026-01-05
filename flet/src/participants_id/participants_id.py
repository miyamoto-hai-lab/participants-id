from datetime import UTC, datetime
from inspect import isawaitable
from logging import getLogger
from typing import Any, Awaitable, Callable, List, Optional, Union
from uuid import UUID

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

logger = getLogger(__name__)

class Participant:
    """
    Fletクライアントストレージを使用してUUIDv7を保存・取得・管理するライブラリです。
    """
    MAX_RETRY_VALIDATION = 10  # ブラウザID検証の最大試行回数

    def __init__(self, page: ft.Page, app_name: str, prefix: str = "participants_id", browser_id_validation_func: Optional[Callable[UUID, Union[bool, Awaitable[bool]]]] = None):
        """
        :param page: 現在のFletアプリケーションのft.Pageオブジェクト
        :type page: flet.Page   
        :param app_name: 実験アプリケーションの名前(attributesの保存に使用されます)
        :type app_name: str
        :param prefix: 他のアプリと区別するためのストレージキーのプレフィックス
            (通常は指定する必要はありません。)
        :type prefix: str
        :param browser_id_validation_func: ブラウザIDの検証関数
            (ブラウザIDを生成した後に保存前に呼び出されます。
            サーバに生成されたIDの登録可否を問い合わせる用途で使用できます。)
        :type browser_id_validation_func: Optional[Callable[uuid.UUID, Union[bool, Awaitable[bool]]]]
            (UUIDを受け取り、受理可否をboolで返す同期/非同期関数を指定できます。)
        """
        self.storage = page.client_storage
        self.app_name = app_name
        self.prefix = prefix
        self.browser_id_validation_func = browser_id_validation_func
    
    @property
    async def browser_id(self) -> Optional[str]:
        """ブラウザIDを取得します。

        ブラウザIDがまだ存在しない時には新たに生成します。

        :return: 保存されていたブラウザID、または生成された新しいブラウザID。生成に失敗した場合はNone。
        :rtype: str | None
        """
        return await self.get_browser_id()
    
    @property
    async def created_at(self) -> Optional[str]:
        """ブラウザIDの生成日時を取得します。

        :return: 保存されていたブラウザIDの生成日時。生成日時が保存されていない場合はNone。
        :rtype: str | None
        """
        return await self.storage.get(f"{self.prefix}.created_at")
    
    @property
    async def updated_at(self) -> Optional[str]:
        """ブラウザIDの更新日時を取得します。

        :return: 保存されていたブラウザIDの更新日時。更新日時が保存されていない場合はNone。
        :rtype: str | None
        """
        return await self.storage.get(f"{self.prefix}.updated_at")
    
    @property
    async def browser_id_version(self) -> Optional[int]:
        """ブラウザIDのバージョンを取得します。

        :return: 保存されていたブラウザIDのバージョン。バージョンが保存されていない場合はNone。
        :rtype: int | None
        """
        return UUID(await self.browser_id).version
    
    async def _generate_browser_id(self) -> Optional[str]:
        """UUIDv7を(再)生成してbrowser_idに保存します。

        [注意!] browser_idを再生成すると他の実験プロジェクトに影響を及ぼす可能性があります。
        再生成は他のプロジェクト関係者に確認を取ってから慎重に行うことをお勧めします。
        
        :return: 新しく生成されたブラウザID。保存に失敗した場合はNone。
        :rtype: str | None
        """
        logger.info("Generating new browser ID...")
        for _ in range(self.MAX_RETRY_VALIDATION):
            new_id = str(uuid7())
            if self.browser_id_validation_func:
                is_valid = self.browser_id_validation_func(new_id)
                if isawaitable(is_valid):
                    is_valid = await is_valid
            else:
                is_valid = True
            if is_valid:
                is_successful = await self.storage.set(f"{self.prefix}.browser_id", new_id)
                if await self.storage.contains_key_async(f"{self.prefix}.created_at"):
                    await self.storage.set(f"{self.prefix}.updated_at", datetime.now(UTC).isoformat().replace("+00:00", "Z"))
                    logger.debug("updated_at written", await self.storage.get(f"{self.prefix}.created_at"), type(await (self.storage.contains_key_async(f"{self.prefix}.created_at"))))
                else:
                    await self.storage.set(f"{self.prefix}.created_at", datetime.now(UTC).isoformat().replace("+00:00", "Z"))
                    logger.debug("created_at written")
                if is_successful:
                    logger.info("Browser ID generated: ", new_id)
                    return new_id
                else:
                    logger.error("Failed to save browser_id to localStorage")
                    return None
            else:
                logger.error("Failed to generate valid browser ID after maximum retries")
                return None

    async def get_browser_id(self) -> Optional[str]:
        """ブラウザIDを取得します。

        ブラウザIDがまだ存在しない時には新たに生成します。

        :return: 保存されていたブラウザID、または生成された新しいブラウザID。生成に失敗した場合はNone。
        :rtype: str | None
        """
        logger.info("Getting browser ID...")
        id = await self.storage.get(f"{self.prefix}.browser_id")
        if id:
            logger.info("Browser ID found: ", id)
            return id
        else:
            logger.info("Browser ID not found, generating new browser ID...")
            return await self._generate_browser_id()
    
    async def browser_id_exists(self) -> bool:
        """ブラウザIDがストレージに存在するかを確認します。
        
        :return: ブラウザIDが存在する場合はTrue、それ以外はFalse
        :rtype: bool
        """
        return await self.storage.contains_key(f"{self.prefix}.browser_id")
    
    async def _delete_browser_id(self) -> bool:
        """ブラウザIDをストレージから削除します。

        [注意!] browser_idを削除すると他の実験プロジェクトに影響を及ぼす可能性が高いです。
        削除は特別な事情がない限り行わないでください。
        
        :return: 削除に成功した場合はTrue、それ以外はFalse
        :rtype: bool
        """
        is_successful = await self.storage.remove(f"{self.prefix}.browser_id")
        if is_successful:
            await self.storage.remove(f"{self.prefix}.created_at")
            await self.storage.remove(f"{self.prefix}.updated_at")
            logger.warning("Browser ID was deleted!")
        else:
            logger.error("Failed to delete browser ID")
        return is_successful
    
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
            logger.info(f"Attribute {field} does not exist, returning default value")
            return default
    
    async def attributes_exists(self, field: str) -> bool:
        """指定されたフィールドがストレージに存在するかを確認します。
        
        :param field: フィールド名
        :type field: str
        
        :return: 属性が存在する場合はTrue、それ以外はFalse
        :rtype: bool
        """
        return await self.storage.contains_key(f"{self.prefix}.{self.app_name}.{field}")

    async def delete_attribute(self, field: str) -> bool:
        """指定されたフィールドの値をストレージから削除します。
        
        :param field: 削除するフィールド名
        :type field: str
        
        :return: 削除に成功した場合はTrue、それ以外はFalse
        :rtype: bool
        """
        logger.info(f"Deleting attribute {field}")
        return await self.storage.remove(f"{self.prefix}.{self.app_name}.{field}")
