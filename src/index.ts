import { blob, Canister, Principal, query, Record, StableBTreeMap, text, update, Void, ic, Vec, Opt, Variant, Result, Err, Ok } from 'azle';

const Post = Record({
    postCreator: Principal,
    message: text,
    image: blob,
});

const PostError = Variant({
    PostDoesNotExist: Principal,
});

let posts = StableBTreeMap(Principal, Post, 0);

export default Canister({
    
    createPost: update([text, blob], Post, (message, image) => {
        
        const id = generateId();
        const post: typeof Post = {
            postCreator: ic.caller(),
            message,
            image,
        };

        posts.insert(id, post);
        
        console.log(`New post created! ID:`, id.toText());
        return post;
    }),
    getPosts: query([], Vec(Post), () => {
        return posts.values();
    }),
    getPost: query([Principal], Opt(Post), (id) => {
        return posts.get(id);
    }),
    updatePost: update([Principal, text], Result(Post, PostError), (id, message) => {
        const postOpt = posts.get(id);

        if ('None' in postOpt) {
            return Err({
                PostDoesNotExist: id
            });
        }

        const post = postOpt.Some;
        const newPost: typeof Post = {
            ...post,
            message,
        };

        posts.insert(id, newPost);

        return Ok(post);
    }),
    deletePost: update([Principal], Result(Post, PostError), (id) => {
        const postOpt = posts.get(id);

        if ('None' in postOpt) {
            return Err({
                PostDoesNotExist: id
            });
        }

        const post = postOpt.Some;
        posts.remove(id);
        
        return Ok(post);
    }),
});

function generateId(): Principal {
    const randomBytes = new Array(29)
        .fill(0)
        .map((_) => Math.floor(Math.random() * 256));

    return Principal.fromUint8Array(Uint8Array.from(randomBytes));
}