# Flet browser-id

[日本語](README.md) | **English**

Library for Flet.

Compatible with Flet 0.28.3.

Currently not supported for Flet 1.0 because [the method of calling Client Storage will change in Flet 1.0](https://flet.dev/blog/introducing-flet-1-0-alpha/#client-storage).

## Installation
```shell
pip install git+https://github.com/miyamoto-hai-lab/browser-id.git#subdirectory=flet
```

## Usage
```python
from browser_id import Browser

async def uuid_not_in_db(uuid: UUID) -> bool:
    # Check that UUID does not exist in the database
    if uuid in db:
      return False
    else:
      return True

async def main(page: ft.Page):
    browser = Browser(page, app_name="my_experiment_app", 
    id_validation_func=uuid_not_in_db)
    browser_id = await browser.id
    return ft.Text(browser_id)

ft.app(target=main)
```
First, create an instance of the Browser class.
Pass the `ft.Page` object and the experiment application name as arguments.

The experiment application name is used when [saving attributes](#saving-and-retrieving-other-information-related-to-subjects).
It is recommended to include your nickname to distinguish it from other lab members' experiment applications.

Also, by passing an arbitrary synchronous/asynchronous function to `id_validation_func`, you can validate the browser ID after generation and before saving. The browser ID is repeatedly regenerated until verification succeeds.
For example, it can be used to guarantee that the newly generated browser ID does not exist in the database by comparing it with UUIDs stored in the database.

### Get Browser-Unique ID for Identifying Subjects
Use the `id` property to get the UUID generated for each browser.
```python
browser_id = await browser.id
```
Executing the above retrieves the UUID stored in each browser's local storage.
If the subject accesses the experiment page for the first time and there is no ID in local storage yet, a new UUID is generated, saved, and returned.

### Saving and Retrieving Other Information Related to Subjects
In this library, you can save and retrieve not only the browser ID but also validation data such as the subject's crowdsourcing ID, age, gender, etc.
```python
await browser.set_attribute("crowdworker_id", "1234567890")
crowdworker_id = await browser.get_attribute("crowdworker_id")
```
Executing the above saves/retrieves the crowdworker ID to/from local storage.

For example, when conducting an experiment on [Crowdworks](https://crowdworks.jp/), by asking each subject for their Crowdworks ID and saving it as an attribute, you can identify the same subject if they try to participate in the experiment multiple times using different browsers.
