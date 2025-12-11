# Flet participants-id
Flet用のライブラリです。

Flet 0.28.3 に対応しています。

[Flet 1.0ではClient Storageの呼び出し方法が変更される](https://flet.dev/blog/introducing-flet-1-0-alpha/#client-storage)ため、現在サポートされていません。

## インストール
```shell
pip install git+https://github.com/miyamoto-hai-lab/participants-id.git#subdirectory=flet
```

## 使い方
```python
from participants_id import Participant

async def uuid_not_in_db(uuid: UUID) -> bool:
    # UUIDがデータベースに存在しないことを確認する
    if uuid in db:
      return False
    else:
      return True

async def main(page: ft.Page):
    participant = Participant(page, app_name="my_experiment_app", 
    browser_id_validation_func=uuid_not_in_db)
    browser_id = await participant.browser_id
    return ft.Text(browser_id)

ft.app(target=main)
```
まず最初にParticipantクラスのインスタンスを生成します。
ft.Pageオブジェクトと、実験アプリケーションの名前を引数として渡します。

実験アプリケーションの名前は[attributesの保存](#被験者を識別するためのブラウザ固有のidを取得する)の際に使用されます。
別の研究室メンバーの実験アプリケーションと区別するために、自身のニックネームを含めることを推奨します。

また，`browser_id_validation_func`に任意の同期/非同期関数を渡すことで、ブラウザIDを生成した後に保存前に検証することができます。検証に成功するまでブラウザIDが繰り返し再生成されます。
例えば，データベースに保存されているUUIDと比較して、新たに生成するブラウザIDがデータベースに存在しないことを保証するなどの用途に使用できます。

### 被験者を識別するためのブラウザ固有のIDを取得する
各ブラウザで生成されたUUIDを取得するには、`browser_id`プロパティを用います。
```python
browser_id = await participant.browser_id
```
上記を実行すると、各ブラウザのローカルストレージに保存されたUUIDが取得できます。
被験者が初めて実験ページにアクセスし、まだローカルストレージにIDがない場合には、新たにUUIDを生成して保存し、返します。

### 被験者に関する他の情報を保存・取得する
このライブラリでは、ブラウザIDだけでなく、被験者のクラウドソーシングIDや年齢、性別など他の情報も保存・取得することができます。
```python
await participant.set_attribute("cloudworker_id", "1234567890")
cloudworker_id = await participant.get_attribute("cloudworker_id")
```
上記を実行すると、ローカルストレージにクラウドワーカーIDを保存・取得できます。

例えば、[クラウドワークス](https://crowdworks.jp/)上で実験を実施する場合、各被験者のクラウドワークスIDを訊いてattributeとして保存しておくことで、ブラウザを変えて被験者が実験に複数回参加しようとした場合に同一被験者を識別することができます。