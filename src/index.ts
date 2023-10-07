import { blob, Canister, Principal, query, Record, StableBTreeMap, text, update, ic, Vec, Opt, Variant, Result, Err, Ok } from 'azle';
//Imports, todas las librerías necesarias para que nuestro canister funcione 

//Creamos una clase customizada. Esta clase la usaremos para almacenar posts en nuestro CRUD Social
//En esta clase almacenamos el creador del post, que es de tipo de dato Principal.
//Puedes leer más sobre este tipo de dato en: https://internetcomputer.org/docs/current/references/candid-ref#type-principal
//También tenemos una propiedad llamada mensaje, en la que almacenamos el texto del mensaje en nuestro post.
//Por último tenemos la propiedad image almacena una imagen. No la almacena en el tipo de dato tradicional, como jpeg, o png,
//sino que debemos crear un arreglo de bytes para almacenarla en la blockchain. Puedes encontrar librerías para convertir archivos
//a este tipo de dato. Puedes leer más aquí: https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
const Post = Record({
    postCreator: Principal,
    message: text,
    image: blob,
});

//Dependiendo de los errores que encontremos podemos agregar o quitar más.
//Esto solamente es necesario para enviar errores personalizados al frontend en caso
//de que queramos manejarlos de manera distinta.
const PostError = Variant({
    PostDoesNotExist: Principal,
});

//Esta es una variable ESTABLE. Es decir, que aunque modifiquemos nuestro canister, los datos
//almacenados en ella persistiran. En este caso es un mapa, una estructura para guardar elementos
//con una llave y un valor. El tipo de la llave es Principal, un tipo que importamos de la librería de Azle.
//El tipo del valor a almacenar es Post, que fue la clase que creamos arriba.
let posts = StableBTreeMap(Principal, Post, 0);

//Esta es la función principal. No necesitas cambiar la declaración pero puedes cambiar las
//funciones que contiene.
export default Canister({
    
    //Crear Post. Esta es una función UPDATE, es decir, escribe información en la blockchain.
    //Recibe 2 parámetros, el primero de tipo text y el segundo de tipo blob.
    //El tipo blob es el tipo de dato que usamos para almacenar archivos en la blockchain.
    //Puedes leer más aquí: https://internetcomputer.org/docs/current/references/candid-ref#type-blob
    createPost: update([text, blob], Post, (message, image) => {
        
        //Creamos un ID utilizando la función privada declarada más abajo.
        const id = generateId();

        //E instanciamos la clase que creamos.
        //Algo de importancia es ic.caller(). ic es un objeto que contiene información sobre
        //la transacción. En este caso estamos usando la propiedad caller para obtener el dato
        //de quien llamó el método y almacenarlo en la blockchain. El tipo de este dato es Principal.
        const post: typeof Post = {
            postCreator: ic.caller(),
            message,
            image,
        };

        //Como en cualquier mapa, almacenamos la información, usando el id que generamos como llave
        //y el post como valor.
        posts.insert(id, post);
        
        console.log(`New post created! ID:`, id.toText());
        return post;
    }),
    //Método query para ver todos los posts en nuestro canister. Regresa un vector conteniendo Posts
    getPosts: query([], Vec(Post), () => {
        return posts.values();
    }),
    //Método query (de lectura) para obtener un post en específico por id.
    //El tipo de dato que regresa es Opt(Post), siendo una opción, puede que el valor que buscamos
    //exista, o puede que no. De esta manera salvaguardamos nuestra función para cualquier error.
    getPost: query([Principal], Opt(Post), (id) => {
        return posts.get(id);
    }),
    //Método de escritura que modifica el mensaje de un POST.
    //Recibe 2 datos, el id y el mensaje a modificar. El tipo de dato de retorno es Result(Post, PostError).
    //Básicamente es un tipo dual, si encuentra el post, regresa un Post, si no entonces regresa un PostError,
    //estos errores los definimos al inicio del archivo! Puedes leer más sobre este tipo de dato en: https://mobily.github.io/ts-belt/api/result/
    updatePost: update([Principal, text], Result(Post, PostError), (id, message) => {
        
        //Buscamos el post en nuestro mapa. Como puede que exista o puede que no, el tipo de dato será Opt(Post)
        const postOpt = posts.get(id);

        //Evaluamos, si nuestra búsqueda arriba retorna algo vacío entonces envíamos el error
        if ('None' in postOpt) {
            return Err({
                PostDoesNotExist: id
            });
        }

        //Si llegamos a esta linea entonces podemos asumir que nuestra variable no estaba vacía. Por lo que es seguro hacer un unwrap utilizando Some.
        const post = postOpt.Some;

        //Creamos un nuevo post, con el spread operator (...) le indicamos que copie todas las propiedades que nuestro post original tenía
        //excepto el mensaje, el cual estamos pasando al constructor para agregar el mensaje modificado.
        const newPost: typeof Post = {
            ...post,
            message,
        };

        //Insertamos el post modificado.
        posts.insert(id, newPost);


        //Y regresamos Ok y el post. Es necesario regresar Ok si nuestro tipo de dato de retorno fue Result.
        return Ok(post);
    }),
    //Método de escritura que borra un post si lo encuentra. Muy similar al método de arriba.
    deletePost: update([Principal], Result(Post, PostError), (id) => {
        const postOpt = posts.get(id);

        if ('None' in postOpt) {
            return Err({
                PostDoesNotExist: id
            });
        }

        const post = postOpt.Some;
        //La única diferencia es que en vez de modificar algo simplemente lo borramos de nuestro mapa.
        posts.remove(id);
        
        return Ok(post);
    }),
});

//Esta es una función privada. Como está fuera de nuestro objeto Canister esta función no puede ser llamada externamente.
//Es decir, esta función solo puede ser llamada desde el código, por lo que de esta manera podemos dividir nuestra lógica en funciones.
function generateId(): Principal {
    const randomBytes = new Array(29)
        .fill(0)
        .map((_) => Math.floor(Math.random() * 256));

    return Principal.fromUint8Array(Uint8Array.from(randomBytes));
}