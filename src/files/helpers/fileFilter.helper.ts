export const fileFilter = (req: Express.Request, file: Express.Multer.File, callback: Function) => {

    if (!file)
        return callback(new Error('File is empty'), false)


    const fileExtension = file.mimetype.split('/')[1]
    const allowedExtension = ['jpg', 'jpeg', 'png', 'gif']

    if (!allowedExtension.includes(fileExtension))
        return callback(new Error('File extension is not allowed'), false)


    callback(null, true)
}