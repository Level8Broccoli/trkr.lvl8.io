import {
  Casefold,
  Collection,
  Count,
  Create,
  Delete,
  Documents,
  Get,
  Index,
  Lambda,
  Map as FaunaMap,
  Match,
  Paginate,
  Ref,
  Select,
} from "faunadb";
import {
  ALL_TRACKERS_INDEX,
  SIZE_OF_ENTRY_PAGE,
  SORT_INDEX_SUFFIX,
} from "../utils/config";
import { db } from "./db";

export const addEntry = async (name, timestamp) => {
  const { data, ref } = await db.query(
    Create(Collection(Casefold(name)), {
      data: { timestamp },
    })
  );
  return { ...data, ref: ref.id };
};

export const getAllEntries = async (name) => {
  const { data, after } = await db.query(
    FaunaMap(
      Paginate(Match(Index(Casefold(name + SORT_INDEX_SUFFIX))), {
        size: SIZE_OF_ENTRY_PAGE,
      }),
      Lambda((_, ref) => Get(ref))
    )
  );

  const count = await db.query(Count(Documents(Collection(Casefold(name)))));

  const config = await db.query(
    Get(Match(Index(ALL_TRACKERS_INDEX), Casefold(name)))
  );

  const dataWithRefId = data.map(({ data, ref }) => ({ ...data, ref: ref.id }));
  const next = after?.[after.length - 1]?.id || undefined;
  return {
    data: dataWithRefId,
    next,
    count,
    created: config.data.timestamp,
  };
};

export const deleteEntry = async (name, id) => {
  const { data, ref } = await db.query(
    Delete(Ref(Collection(Casefold(name)), id))
  );
  return { ...data, ref: ref.id };
};

export const getMoreEntries = async (name, afterId) => {
  const { data, after } = await db.query(
    FaunaMap(
      Paginate(Match(Index(Casefold(name + SORT_INDEX_SUFFIX))), {
        after: [
          Select(
            ["data", "timestamp"],
            Get(Ref(Collection(Casefold(name)), afterId))
          ),
          Ref(Collection(Casefold(name)), afterId),
        ],
        size: SIZE_OF_ENTRY_PAGE,
      }),
      Lambda((_, ref) => Get(ref))
    )
  );

  const count = await db.query(Count(Documents(Collection(Casefold(name)))));

  const dataWithRefId = data.map(({ data, ref }) => ({ ...data, ref: ref.id }));
  const next = after?.[after.length - 1]?.id || undefined;
  return { data: dataWithRefId, next, count };
};
