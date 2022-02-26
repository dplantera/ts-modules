import {TsUtils} from "@dplan/ts-utils";
import {TestLib} from "@dplan/testing";
import {Repo} from "@dplan/client-persistence";


const date = TsUtils.dates.toString(new Date());
const number = TestLib.random.number();
const fromDb = Repo.create();

fromDb.insert();
console.log({date, number})
