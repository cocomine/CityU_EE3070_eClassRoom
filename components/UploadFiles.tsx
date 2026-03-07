import { FileCard, FileUploadingCard } from "@/components/FileCard";
import { showErrorAlert } from "@/components/ui/alert";
import { BottomSheet as UIBottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { wait } from "@/utils/wait";
import { getDocumentAsync } from "expo-document-picker";
import {
    launchCameraAsync,
    launchImageLibraryAsync,
    requestCameraPermissionsAsync,
    requestMediaLibraryPermissionsAsync
} from "expo-image-picker";
import { Camera, ImagePlus, Paperclip } from "lucide-react-native";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";

// Uploaded file data structure
export interface UploadedFile {
    id: string;
    name: string;
}

// File upload request data structure
export interface UploadFileRequest {
    id: string;
    file: {
        uri: string;
        mimeType?: string;
        size?: number;
        name: string;
    },
    progress: number;
    status: 'uploading' | 'failed';
    error?: string;
    simulateFailAt?: number; // For simulation purposes only; remove when real upload status is available from backend.
}

// Props for the UploadFiles component
export interface UploadFilesProps {
    data: UploadedFile[] | null;
    uploadUrl?: string;
}

// Expose `open` method and `uploadUrl` to parent components via ref for programmatic control.
export interface UploadFilesHandle {
    open: () => void;
    uploadUrl: string;
}

/**
 * Component to display a horizontal list of uploaded files for the selected course.
 * @constructor
 */
export const UploadFiles = forwardRef<UploadFilesHandle, UploadFilesProps>(({data, uploadUrl}, ref) => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[] | null>(data);
    const [uploadRequests, setUploadRequests] = useState<UploadFileRequest[]>([]);
    const {isVisible, open, close} = useBottomSheet();
    // Store custom upload endpoint for future real upload requests.
    const uploadEndpoint = uploadUrl ?? '';

    // Expose `open` method and `uploadEndpoint` to parent components via ref.
    useImperativeHandle(ref, () => ({open, uploadUrl: uploadEndpoint}), [open, uploadEndpoint]);

    // Track timers per upload so we can cancel or clean them up.
    const uploadTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

    // Unique id for each upload request to tie UI state to timers.
    const createUploadId = useCallback(() => {
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }, []);

    // Callback to handle file deletion
    const deleteFile = useCallback((id: string) => {
        console.log("Deleting file with id: ", id);

        //TODO: send delete request to backend to delete the file with the given id
        setUploadedFiles(prevState => prevState ? prevState.filter(file => file.id !== id) : null);
    }, []);

    // Simulate upload progress with a timer; on completion move to uploaded list.
    // TODO: replace this with a real upload request, and update progress from network callbacks.
    const startUploadSimulation = useCallback((uploadId: string) => {
        if ( uploadTimers.current.has(uploadId) ) return;
        const timerId = setInterval(() => {
            setUploadRequests(prevState => {
                const index = prevState.findIndex(item => item.id === uploadId);
                if ( index === -1 ) return prevState;

                const current = prevState[index];
                if ( current.status === 'failed' ) return prevState;
                const increment = 5 + Math.floor(Math.random() * 12);
                const nextProgress = Math.min(100, current.progress + increment);

                if ( current.simulateFailAt !== undefined && nextProgress >= current.simulateFailAt ) {
                    clearInterval(timerId);
                    uploadTimers.current.delete(uploadId);

                    const nextState = [...prevState];
                    nextState[index] = {
                        ...current,
                        progress: current.simulateFailAt,
                        status: 'failed',
                        error: 'Upload failed (simulated).'
                    };
                    return nextState;
                }

                if ( nextProgress >= 100 ) {
                    clearInterval(timerId);
                    uploadTimers.current.delete(uploadId);

                    setUploadedFiles(prevUploaded => {
                        const base = prevUploaded ?? [];
                        // TODO: replace uploadId with server-provided file id after a real upload succeeds.
                        return [{id: uploadId, name: current.file.name}, ...base];
                    });

                    const nextState = [...prevState];
                    nextState.splice(index, 1);
                    return nextState;
                }

                const nextState = [...prevState];
                nextState[index] = {...current, progress: nextProgress};
                return nextState;
            });
        }, 400);
        uploadTimers.current.set(uploadId, timerId);
    }, []);

    // Stop the timer and remove the upload card when user cancels.
    const cancelUpload = useCallback((uploadId: string) => {
        // TODO: abort the real upload request when backend is wired up.
        const timerId = uploadTimers.current.get(uploadId);
        if ( timerId ) {
            clearInterval(timerId);
            uploadTimers.current.delete(uploadId);
        }

        // Remove the upload card from the list.
        setUploadRequests(prevState => prevState.filter(item => item.id !== uploadId));
    }, []);

    // Pick files and enqueue them for simulated uploading.
    const pickFiles = useCallback(async () => {
        const result = await getDocumentAsync({
            multiple: true,
            copyToCacheDirectory: true
        });
        console.debug(result); //debug
        if ( result.canceled ) return;

        // Map picked files to upload requests with simulated progress and random failure.
        // TODO: start real upload per file and map progress to `uploadRequests` when backend is available.
        const newRequests: UploadFileRequest[] = result.assets.map(item => {
            // Simulate a random failure for some uploads to demonstrate error handling in the UI.
            // Remove this when real upload status is available from backend.
            const shouldFail = Math.random() < 0.25;
            const failAt = shouldFail ? 20 + Math.floor(Math.random() * 60) : undefined;

            return {
                id: createUploadId(),
                progress: 0,
                status: 'uploading',
                error: undefined,
                simulateFailAt: failAt, // For simulation purposes only; remove when real upload status is available
                                        // from backend.
                file: {
                    uri: item.uri,
                    name: item.name,
                    mimeType: item.mimeType,
                    size: item.size
                }
            };
        });

        // Enqueue new uploads and start their simulation.
        setUploadRequests(prevState => [...prevState, ...newRequests]);
        // Start upload simulation for each new request. In a real implementation, this would be triggered by the
        // actual upload logic and progress callbacks instead.
        newRequests.forEach(request => startUploadSimulation(request.id));
    }, [createUploadId, startUploadSimulation]);

    // Pick media files and enqueue them for simulated uploading.
    const pickMedia = useCallback(async () => {
        // Request permission to access media library first, as it's required for picking images or videos.
        // This is especially important on mobile platforms where permissions are enforced at runtime.
        const permissionResult = await requestMediaLibraryPermissionsAsync();

        // Check if permission was granted before proceeding. If not, show an error alert and return early.
        if ( !permissionResult.granted ) {
            showErrorAlert(
                "Permission denied",
                "Permission to access media library is required to upload files. " +
                "Please enable it in your device settings."
            );
            return;
        }

        // launch the image library to pick media files.
        const result = await launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true
        });
        console.debug(result); //debug
        if ( result.canceled ) return;

        // Map picked files to upload requests with simulated progress and random failure.
        // TODO: start real upload per file and map progress to `uploadRequests` when backend is available.
        const newRequests: UploadFileRequest[] = result.assets.map(item => {
            // Simulate a random failure for some uploads to demonstrate error handling in the UI.
            // Remove this when real upload status is available from backend.
            const shouldFail = Math.random() < 0.25;
            const failAt = shouldFail ? 20 + Math.floor(Math.random() * 60) : undefined;

            return {
                id: createUploadId(),
                progress: 0,
                status: 'uploading',
                error: undefined,
                simulateFailAt: failAt, // For simulation purposes only; remove when real upload status is available
                                        // from backend.
                file: {
                    uri: item.uri,
                    name: item.fileName || createUploadId(),
                    mimeType: item.mimeType,
                    size: item.fileSize
                }
            };
        });

        // Enqueue new uploads and start their simulation.
        setUploadRequests(prevState => [...prevState, ...newRequests]);
        // Start upload simulation for each new request. In a real implementation, this would be triggered by the
        // actual upload logic and progress callbacks instead.
        newRequests.forEach(request => startUploadSimulation(request.id));
    }, [createUploadId, startUploadSimulation]);

    // Open camera to take a photo and enqueue it for simulated uploading.
    const openCamera = useCallback(async () => {
        // Permission to access camera is required to take photos, so we request it at runtime before launching the
        // camera.
        const permissionResult = await requestCameraPermissionsAsync();

        // Check if permission was granted before proceeding. If not, show an error alert and return early.
        if ( !permissionResult.granted ) {
            showErrorAlert(
                "Permission denied",
                "Permission to access camera is required to take photos. " +
                "Please enable it in your device settings."
            );
            return;
        }

        // Now that we have permission, we can safely launch the image library to pick media files.
        const result = await launchCameraAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true
        });
        console.debug(result); //debug
        if ( result.canceled ) return;

        // Map picked files to upload requests with simulated progress and random failure.
        // TODO: start real upload per file and map progress to `uploadRequests` when backend is available.
        const newRequests: UploadFileRequest[] = result.assets.map(item => {
            // Simulate a random failure for some uploads to demonstrate error handling in the UI.
            // Remove this when real upload status is available from backend.
            const shouldFail = Math.random() < 0.25;
            const failAt = shouldFail ? 20 + Math.floor(Math.random() * 60) : undefined;

            const fileExtension = item.uri?.split('.').pop();
            const fileName = item.fileName || `Camera_${new Date().toISOString()}.${fileExtension}`;

            return {
                id: createUploadId(),
                progress: 0,
                status: 'uploading',
                error: undefined,
                simulateFailAt: failAt, // For simulation purposes only; remove when real upload status is available
                // from backend.
                file: {
                    uri: item.uri,
                    name: fileName,
                    mimeType: item.mimeType,
                    size: item.fileSize
                }
            };
        });

        // Enqueue new uploads and start their simulation.
        setUploadRequests(prevState => [...prevState, ...newRequests]);
        // Start upload simulation for each new request. In a real implementation, this would be triggered by the
        // actual upload logic and progress callbacks instead.
        newRequests.forEach(request => startUploadSimulation(request.id));
    }, [createUploadId, startUploadSimulation]);

    // Handle menu option selection, close the menu, and trigger the corresponding action.
    const menuChose = useCallback(async (opt: 'files' | 'media' | 'camera') => {
        close();
        await wait(300);
        if ( opt === 'files' ) await pickFiles();
        else if ( opt === 'media' ) await pickMedia();
        else if ( opt === 'camera' ) await openCamera();
    }, [close, openCamera, pickFiles, pickMedia]);

    // Cleanup any running timers when the component unmounts.
    useEffect(() => {
        return () => {
            //TODO: also abort any real upload requests when backend is wired up.
            uploadTimers.current.forEach(timerId => clearInterval(timerId));
            uploadTimers.current.clear();
        };
    }, []);

    // Update local uploaded files state when the `data` prop changes (e.g. after fetching from backend).
    useEffect(() => {
        setUploadedFiles(data);
    }, [data]);

    return (
        <>
            <View style={{marginTop: 10}}>
                    {uploadedFiles === null && uploadRequests.length === 0 ? (
                        // Show skeleton only when there are no uploads in progress and uploaded files are still
                        // loading.
                        <Skeleton width={'100%'} height={60}/>
                    ) : (
                        // Show both uploading files and already uploaded files in a horizontal list.
                        <FlatList
                            style={{paddingBottom: 8}}
                            horizontal={true}
                            data={[
                                // uploading files
                                ...uploadRequests.map(item => ({type: 'uploading' as const, item})),
                                // already uploaded files
                                ...(uploadedFiles ?? []).map(item => ({type: 'uploaded' as const, item}))
                            ]}
                            renderItem={({item}) =>
                                item.type === 'uploading' ? (
                                    // uploading files
                                    <FileUploadingCard
                                        file={item.item}
                                        onCancel={() => cancelUpload(item.item.id)}
                                    />
                                ) : (
                                    // already uploaded files
                                    <FileCard
                                        filename={item.item.name}
                                        onClick={() => deleteFile(item.item.id)}
                                    />
                                )
                            }
                            keyExtractor={(item) =>
                                item.type === 'uploading'
                                    ? `uploading-${item.item.id}`
                                    : `uploaded-${item.item.id}`
                            }
                            ListEmptyComponent={
                                <Text variant={'caption'}>No files uploaded yet.</Text>
                            }
                            ItemSeparatorComponent={props => <View style={{width: 10}} {...props}/>}
                        />
                    )}
                </View>
            <UIBottomSheet isVisible={isVisible} onClose={close} snapPoints={[0.30]}>
                <View>
                    <TouchableOpacity style={styles.uploadMenu} onPress={() => menuChose('files')}>
                        <Icon name={Paperclip} size={20} style={{marginRight: 16}}/>
                        <Text variant="body">Files</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadMenu} onPress={() => menuChose('media')}>
                        <Icon name={ImagePlus} size={20} style={{marginRight: 16}}/>
                        <Text variant="body">Media Library</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadMenu} onPress={() => menuChose('camera')}>
                        <Icon name={Camera} size={20} style={{marginRight: 16}}/>
                        <Text variant="body">Camera</Text>
                    </TouchableOpacity>
                </View>
            </UIBottomSheet>
        </>
    );
});

UploadFiles.displayName = 'UploadFiles';


const styles = StyleSheet.create({
    uploadMenu: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16
    },
    container: {
        flex: 1
    },
    uploadedFilesTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        justifyContent: 'space-between'
    }
});
