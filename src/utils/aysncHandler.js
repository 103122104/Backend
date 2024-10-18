const asyncHandler = (fn) => async (req, res, next) => {
    try{
        await fn(req, res, next)
    }catch(error){
        res.status(err.code || 500).json({
            success: false,
            message: err.message
        })
    }
}

// way-2
// const asyncHandler2 = (requestHanler) =>{
//     (res, req, next) =>{
//         Promise.resolve(requestHanler(req, res, next)).reject((err) => next(err))
//     }
// }

export {asyncHandler}